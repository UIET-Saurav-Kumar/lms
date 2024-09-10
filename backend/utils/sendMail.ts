import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
require('dotenv').config()


interface EmailOptions {
    email : string,
    subject : string,
    template : string,
    data : {[key:string]:any}
}

const sendEmail = async ({email , subject , template , data} : EmailOptions) : Promise<void> => {
    
    const transporter : Transporter = nodemailer.createTransport  ({
         host : process.env.STMP_HOST,
         port : parseInt(process.env.STMP_PORT || '587'),
         service : process.env.STMP_SERVICE,
         auth : {
            user : process.env.STMP_MAIL,
            pass : process.env.STMP_PASSWORD,
         }
    })

    //get email template path

    const templatePath = path.join(__dirname , template)
    
    const html : string = await ejs.renderFile(templatePath , data)

    const mailOptions = {
        from : process.env.SMTP_MAIL,
        to : email,
        subject,
        html
    }
     
    await transporter.sendMail(mailOptions)
}


export default sendEmail