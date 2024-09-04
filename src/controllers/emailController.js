import nodemailer from 'nodemailer';


const getEmail = async (req, res) => {
  const {email} = req.query
}


const sendEmailForNewReleases = async (newReleases) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  //const recipientEmail = 'danielaraujoleal985@gmail.com';

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail, 
    subject: 
    `Novos lançamentos do artista ${newReleases.artist}`,
    text: 
    `Confira os novos álbuns e faixas de ${newReleases.artist}:\n\n` +
          `Álbuns:\n${newReleases.albums.map(album => album.name).join('\n')}\n\n` +
          `Top Tracks:\n${newReleases.topTracks.map(track => track.name).join('\n')}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email enviado com sucesso');
  } catch (error) {
    console.error('Erro ao enviar email:', error.message);
  }
  return mailOptions;
};

export default sendEmailForNewReleases;