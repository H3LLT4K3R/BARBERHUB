import transporter from '../config/mail.js';
import { supabaseAdmin } from '../config/supabase.js';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const MODERADOR_EMAIL = process.env.MAIL_USER;

async function esOwner(userId, barberiaId) {
    const { data, error } = await supabaseAdmin
        .from('barberia_memberships')
        .select('id')
        .eq('barberia_id', barberiaId)
        .eq('profile_id', userId)
        .eq('role', 'owner')
        .eq('is_active', true)
        .maybeSingle();
    if (error) throw error;
    return data;
}

async function esOwnerOAdmin(userId, barberiaId) {
    const { data, error } = await supabaseAdmin
        .from('barberia_memberships')
        .select('id')
        .eq('barberia_id', barberiaId)
        .eq('profile_id', userId)
        .in('role', ['owner', 'admin'])
        .eq('is_active', true)
        .maybeSingle();
    if (error) throw error;
    return data;
}

// El dueño envía su link de Mercado Pago a revisión manual
export const solicitarLink = async (req, res) => {
    const { barberiaId, link } = req.body;
    if (!barberiaId || !link) {
        return res.status(400).json({ error: 'Faltan barberiaId o link.' });
    }

    try {
        const membership = await esOwner(req.user.id, barberiaId);
        if (!membership) {
            return res.status(403).json({ error: 'Solo el dueño de la barbería puede solicitar esto.' });
        }

        const { data: barberia } = await supabaseAdmin
            .from('barberias')
            .select('name')
            .eq('id', barberiaId)
            .maybeSingle();

        const { data: solicitud, error: upsertError } = await supabaseAdmin
            .from('payment_provider_accounts')
            .upsert(
                {
                    barberia_id: barberiaId,
                    provider: 'mercado_pago',
                    payment_link: link,
                    status: 'pending_review',
                    requested_by: req.user.id,
                    reviewed_by: null,
                    reviewed_at: null,
                    rejection_reason: null,
                },
                { onConflict: 'barberia_id,provider' }
            )
            .select('id')
            .single();
        if (upsertError) throw upsertError;

        const nombreBarberia = barberia?.name ?? barberiaId;
        
        // 🔴 AQUÍ SE AGREGAN LOS DOS BOTONES (APROBAR / RECHAZAR) EN EL CORREO
        try {
            await transporter.sendMail({
                from: '"Sistema BarberHub" <bartfestmixology@gmail.com>',
                to: MODERADOR_EMAIL,
                subject: `🚨 Nueva solicitud de Link: ${nombreBarberia}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                        <h2 style="color: #333;">Nueva solicitud de revisión de Link</h2>
                        <p><strong>Barbería:</strong> ${nombreBarberia}</p>
                        <p><strong>Link a revisar:</strong> <a href="${link}">${link}</a></p>
                        <br>
                        <p>Haz clic en uno de los siguientes enlaces para tomar una decisión. <strong>La acción es inmediata:</strong></p>
                        <br>
                        <a href="${BACKEND_URL}/api/aprobar/${solicitud.id}"
                           style="padding: 12px 20px; background-color: #28a745; color: white; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block; margin-right: 15px;">
                           ✅ APROBAR
                        </a>
                        <a href="${BACKEND_URL}/api/rechazar/${solicitud.id}"
                           style="padding: 12px 20px; background-color: #dc3545; color: white; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
                           ❌ RECHAZAR
                        </a>
                    </div>
                `,
            });
        } catch (mailError) {
            console.error('Error al enviar el correo de solicitud:', mailError);
        }

        res.json({ mensaje: 'Enviado a revisión exitosamente.', id: solicitud.id });
    } catch (error) {
        console.error('Error al solicitar el link de pago:', error);
        res.status(500).json({ error: 'No fue posible enviar la solicitud.' });
    }
};

// 1. APROBAR LINK DIRECTO (Desde el botón del correo)
export const aprobarLink = async (req, res) => {
    try {
        const { data: solicitud, error: fetchError } = await supabaseAdmin
            .from('payment_provider_accounts')
            .select('id, payment_link, requested_by')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!solicitud) {
            return res.status(404).send("<h1 style='color: red; text-align: center; font-family: Arial;'>❌ Solicitud no encontrada</h1>");
        }

        const { error: updateError } = await supabaseAdmin
            .from('payment_provider_accounts')
            .update({ 
                status: 'approved', 
                reviewed_at: new Date().toISOString(),
                rejection_reason: null // Limpiamos el motivo por si antes había sido rechazado
            })
            .eq('id', solicitud.id);
        if (updateError) throw updateError;

        if (solicitud.requested_by) {
            await supabaseAdmin.from('notifications').insert({
                profile_id: solicitud.requested_by,
                type: 'system',
                title: '¡Tu link de pago fue aprobado!',
                body: 'Ya puedes empezar a recibir pagos en la plataforma con el enlace que enviaste.',
                action_url: '/owner-control',
                data: { paymentProviderAccountId: solicitud.id },
            });
        }

        res.send("<h1 style='color: green; text-align: center; margin-top: 50px; font-family: Arial;'>✅ Link Aprobado y Barbero Notificado exitosamente. Ya puedes cerrar esta pestaña.</h1>");
    } catch (error) {
        console.error('Error al aprobar el link:', error);
        res.send("<h1 style='color: red; text-align: center; font-family: Arial;'>❌ Ocurrió un error al aprobar el link.</h1>");
    }
};

// 2. ABRIR PANTALLA DE RECHAZO (Desde el botón del correo)
export const rechazarLink = (req, res) => {
    const { id } = req.params;
    
    const htmlPantalla = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Rechazar Link BarberHub</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .caja { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
          textarea { width: 100%; height: 100px; margin-top: 15px; padding: 10px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box; resize: none; font-family: inherit;}
          button { margin-top: 20px; padding: 12px 20px; border: none; border-radius: 5px; background: #dc3545; color: white; cursor: pointer; font-size: 16px; width: 100%; font-weight: bold;}
          button:hover { background: #c82333; }
        </style>
      </head>
      <body>
        <div class="caja" id="caja-principal">
          <h2>❌ Rechazar Solicitud</h2>
          <p>Por favor, escribe el motivo del rechazo para notificárselo al dueño de la barbería:</p>
          
          <textarea id="motivo" placeholder="Ej. El link marca error al abrir o está caducado..." required></textarea>
          <button onclick="enviarDecision()">Confirmar Rechazo</button>
        </div>

        <script>
          async function enviarDecision() {
            const motivo = document.getElementById('motivo').value.trim();
            if (!motivo) return alert('Por favor escribe un motivo para continuar.');

            // Deshabilitamos el botón para evitar doble clic
            document.querySelector('button').disabled = true;
            document.querySelector('button').innerText = 'Guardando...';

            try {
              const respuesta = await fetch('/api/procesar-rechazo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: "${id}", motivo: motivo })
              });

              if (respuesta.ok) {
                document.getElementById('caja-principal').innerHTML = '<h2 style="color: #dc3545;">¡Solicitud Rechazada! ❌</h2><p>El motivo fue guardado correctamente y el dueño ha sido notificado en su app.</p><p style="color: gray; margin-top: 20px;">Ya puedes cerrar esta pestaña.</p>';
              } else {
                throw new Error('Error en el servidor');
              }
            } catch(e) {
                alert('Hubo un error al guardar la decisión. Inténtalo de nuevo.');
                document.querySelector('button').disabled = false;
                document.querySelector('button').innerText = 'Confirmar Rechazo';
            }
          }
        </script>
      </body>
      </html>
    `;
  
    res.send(htmlPantalla);
};

// 3. PROCESAR RECHAZO (Recibe el motivo de la pantalla HTML)
export const procesarRechazo = async (req, res) => {
    try {
        const { id, motivo } = req.body;

        const { data: solicitud, error: fetchError } = await supabaseAdmin
            .from('payment_provider_accounts')
            .select('id, requested_by')
            .eq('id', id)
            .maybeSingle();
        
        if (fetchError || !solicitud) throw new Error('Solicitud no encontrada');

        const { error: updateError } = await supabaseAdmin
            .from('payment_provider_accounts')
            .update({ 
                status: 'rejected', 
                rejection_reason: motivo,
                reviewed_at: new Date().toISOString() 
            })
            .eq('id', id);
        
        if (updateError) throw updateError;

        if (solicitud.requested_by) {
            await supabaseAdmin.from('notifications').insert({
                profile_id: solicitud.requested_by,
                type: 'system',
                title: '⚠️ Tu link de pago fue rechazado',
                body: `Motivo: ${motivo}`,
                action_url: '/owner-control',
                data: { paymentProviderAccountId: solicitud.id },
            });
        }

        res.status(200).json({ mensaje: 'Rechazado exitosamente' });
    } catch (error) {
        console.error('Error al rechazar:', error);
        res.status(500).json({ error: 'Error al procesar el rechazo' });
    }
};

// Consultar el estado del link
export const estadoLink = async (req, res) => {
    const { barberiaId } = req.params;

    try {
        const membership = await esOwnerOAdmin(req.user.id, barberiaId);
        if (!membership) return res.status(403).json({ error: 'No tienes permiso sobre esta barbería.' });

        const { data: solicitud, error } = await supabaseAdmin
            .from('payment_provider_accounts')
            .select('status, payment_link')
            .eq('barberia_id', barberiaId)
            .eq('provider', 'mercado_pago')
            .maybeSingle();
        if (error) throw error;

        res.json(solicitud ? { estado: solicitud.status, link: solicitud.payment_link } : { estado: 'sin_registro' });
    } catch (error) {
        console.error('Error al consultar el estado del link:', error);
        res.status(500).json({ error: 'No fue posible consultar el estado.' });
    }
};