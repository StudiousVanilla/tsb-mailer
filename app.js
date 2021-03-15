const express = require('express')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 3000 

// middleware
app.use(express.json())
// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'https://studiousvanilla.github.io');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


// need to add validate email from frontend (req.body.email)

app.post('/', (req, res) => {

    console.log(req.body)

    const nodemailer = require("nodemailer");

    // async..await is not allowed in global scope, must use a wrapper
    async function main() {

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
            user: 'tsbdevinfo@gmail.com',
            pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: 'tsbdevinfo@gmail.com',
            to: 'byrne.ois@gmail.com',
            subject: 'TSB Contact form - '+req.body.name,
            
            html:
            `<br>Name: <b>${req.body.name}</b>
            <br>Email: <b>${req.body.email}</b>
            <br><br>${req.body.message}`,

            text:
            `\nName: ${req.body.name}
            \nEmail: ${req.body.email}
            \n${req.body.message}`
        }

        await transporter.sendMail(mailOptions, (error, info) =>{
            
            if(error){
                res.send({message: "There was a probelm sending your message. Please Refresh the page and try again"})
            }
            else{
                res.send({message: 'Your message has been sent'})
            }
        });
    }

    main().catch(console.error);
})


app.listen(port, () => {
  console.log(`Example app listening at ${port}`)
})