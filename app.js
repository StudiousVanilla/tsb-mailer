const express = require('express')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 3000 
// for email validation
const validator = require("email-validator");
//cookies
const cookieSession = require("cookie-session")

// middleware
app.use(express.json())
// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'https://tsbcoaching.ie');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);


    res.setHeader('set-cookie', 'samesite=None; secure');

    // Pass to next layer of middleware
    next();
});
// cookies
app.use(
    cookieSession({
      name: "__session",
      keys: ["key1"],
        maxAge: 24 * 60 * 60 * 100,
        secure: true,
        httpOnly: true,
        sameSite: 'none'
    })
);

app.get('/', (req, res)=>{
    res.send('hello')
})


// need to add validate email from frontend (req.body.email)
// handles post requests from TSB contact page and sends an email with the message fromt eh contatc form
app.post('/', (req, res) => {

    const nodemailer = require("nodemailer");

    // validate email address
    const emailTest = validator.validate(req.body.email);
    if(!emailTest){
        res.send({message: "Please input a valid email"})
    }

    // sends email based on form data
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

        // message/email details
        const mailOptions = {
            from: 'tsbdevinfo@gmail.com',
            // update this to mona's email address
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

        // sends email using transport and options defined above
        await transporter.sendMail(mailOptions, (error, info) =>{
            
            if(error){
                console.log(info)
                res.send({message: 'Error'})
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