const express = require('express')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 3000 
// for email validation
const validator = require("email-validator");
//cookies
const cookieSession = require("cookie-session")


//firebase connection
const firebase = require('firebase/app');
require('firebase/firestore');
require('firebase/auth');
require('firebase/storage');
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGEBUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
};
const fireDone = firebase.initializeApp(firebaseConfig)
const db = fireDone.firestore()

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



// gets all the published blogs
app.get('/blogs', (req, res)=>{
    
    // pulls blog information based on number of blogs and if they are published
    db.collection("blogs").where('published', '==', true)
    .get()
    .then((querySnapshot) => {
        // addes blog data to blogsArray
        let blogArray = []
        querySnapshot.docs.forEach(doc =>{
            blogArray.push(doc.data())
        })

        // sort blogArray by date
        const sortedArray = blogArray.sort((a, b) => a.date > b.date ? -1 : 1)

        // update Sate
        console.log(sortedArray)

        res.send(sortedArray)
    })
    .catch((error) => {
        console.log("Error getting documents: ", error);
    });

})

// gets specific blog post
// needs a blog reference in the request body
app.get('/blogpost', (req, res)=>{

    const blogNumber = req.body.ref

    console.log(req.body.ref)
    
    // pulls blog information for blog that matches title (the blogRef)
    db.collection("blogs").where('blogID', '==', blogNumber)
    .get()
    .then((querySnapshot) => {
        // addes blog data to blogsArray
        let blog = null
        querySnapshot.docs.forEach(doc =>{
            blog = doc.data()
        })

        // update Sate
        res.send(blog)
    })
    .catch((error) => {
        console.log("Error getting documents: ", error);
    });

})

// gets blogs filtered by theme
// needs a theme in the request body
app.get('/blogfilter', (req, res)=>{

    const theme = req.body.theme

    console.log(req.body.theme)
    
    // pulls blog information based on if they are published and if they match the filtered theme from the url params
    db.collection("blogs")
    .where('published', '==', true)
    .where('theme', '==', theme)
    .get()
    .then((querySnapshot) => {
        // adds blog data to blogsArray
        let blogArray = []
        querySnapshot.docs.forEach(doc =>{
            blogArray.push(doc.data())
        })

        // sort blogArray by date
        const sortedArray = blogArray.sort((a, b) => a.date > b.date ? -1 : 1)

        // update Sate
        res.send(sortedArray)
        
    })
    .catch((error) => {
        console.log("Error getting documents: ", error);
    });

})

// gets all blog themes, and most recent blog (for tsb Sidebar)
// needs a theme in the request body
app.get('/blogthemes', (req, res)=>{
    
    // pulls blog information based on number of blogs and if they are published
    db.collection("blogs").where('published', '==', true)
    .get()
    .then((querySnapshot) => {
        // addes blog data to blogsArray
        let blogArray = []
        querySnapshot.docs.forEach(doc =>{
            let blog = doc.data()
            blogArray.push(blog)
        })

        // sort blogArray by date
        const sortedByDate = blogArray.sort((a, b) => a.date > b.date ? -1 : 1)
        // grab mosr recent blog
        let recentBlog = sortedByDate[0]

        // holds all the themes from the blog database
        let blogThemeArray = []
        
        // sort blogArray by date
        const sortedByTheme = blogArray.sort((a, b) => a.theme > b.theme ? 1 : -1)

        // filters blogs based on theme
        const filteredArray = sortedByTheme.filter((blog)=>{
            if(blogThemeArray.includes(blog.theme)){
                
            }
            else{
                blogThemeArray.push(blog.theme)
                return blog
            }
            return null
        })

        res.send([recentBlog, filteredArray])

    })
    .catch((error) => {
        console.log("Error getting documents: ", error);
    });
})


// just to stop errors when testing Heroku app
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
            to: 'tsbcoaching@gmail.com',
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
                res.send({message: "There was a probelm sending your message. Please refresh the page and try again"})
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