import transporter from '../config/mail.js';

let solicitudes = []; 

export const solicitarLink = async (req, res) => {
    // Solo pedimos barberia y link, como en tu código original
    const { barberia, link } = req.body;
    
    const nuevaSolicitud = { 
        id: Date.now(), 
        barberia: barberia,
        link: link, 
        estado: 'Pendiente' 
    };
    
    solicitudes.push(nuevaSolicitud);
    console.log("NUEVA SOLICITUD RECIBIDA:", nuevaSolicitud);
    
    try {
        await transporter.sendMail({
            from: '"Sistema BarberHub" <bartfestmixology@gmail.com>',
            to: 'bartfestmixology@gmail.com', // Te lo envía a ti mismo para que lo puedas aprobar
            subject: `🚨 Nueva solicitud de Link: ${barberia}`,
            html: `
                <h2>Se ha enviado un nuevo link para revisión</h2>
                <p><strong>Barbería:</strong> ${barberia}</p>
                <p><strong>Link a revisar:</strong> <a href="${link}">${link}</a></p>
                <br>
                <p>Haz clic en el siguiente enlace para aprobarlo y habilitarlo en la plataforma:</p>
                <a href="http://localhost:3000/api/aprobar/${nuevaSolicitud.id}" 
                   style="padding: 20px 20px; background-color: #ffcb5c; color: black; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
                   ✅ APROBAR LINK DE LA BARBERIA: ${barberia}
                </a>
            `
        });

        res.json({ mensaje: "Enviado a revisión exitosamente.", id: nuevaSolicitud.id });
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        res.status(500).json({ mensaje: "Error al enviar el correo al moderador." });
    }
};

export const aprobarLink = async (req, res) => {
    const solicitud = solicitudes.find(s => s.id == req.params.id);
    
    if(solicitud) {
        solicitud.estado = 'Aprobado';
        console.log("SOLICITUD APROBADA:", solicitud);

        try {
            await transporter.sendMail({
                from: '"Moderación BarberHub" <bartfestmixology@gmail.com>',
                to: 'helltaker10000@gmail.com', // El correo que tenías fijo en tu prueba
                subject: '✅ ¡Tu Link de Pago ha sido Aprobado!',
                html: `
                    <h2>¡Felicidades!</h2>
                    <p>Tu link de Mercado Pago ha sido revisado y <strong>aprobado</strong>.</p>
                    <p>Ya puedes empezar a recibir pagos en la plataforma con el siguiente enlace:</p>
                    <p><a href="${solicitud.link}">${solicitud.link}</a></p>
                `
            });

            res.send("<h1 style='color: green; text-align: center; margin-top: 50px;'>✅ Link Aprobado y Barbero Notificado.</h1>");
        } catch (error) {
            console.error(error);
            res.send("<h1>Link aprobado, pero falló el envío del correo.</h1>");
        }

    } else {
        res.status(404).send("<h1 style='color: red; text-align: center;'>❌ Solicitud no encontrada</h1>");
    }
};

export const estadoLink = (req, res) => {
    const { barberia } = req.params;
    const solicitud = solicitudes.find(s => s.barberia === barberia);
    
    if (solicitud) {
        res.json({ estado: solicitud.estado, link: solicitud.link });
    } else {
        res.json({ estado: 'Sin registro' });
    }
};