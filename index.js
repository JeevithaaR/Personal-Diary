const express = require('express');
const app = express();
const sqlite3 = require('sqlite3')
const port = 3000;
const session = require('express-session');
const moment = require('moment');

app.set('view engine','ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'your-secret-key', // Change this to a secure random string
    resave: false,
    saveUninitialized: true
}));

const db = new sqlite3.Database('./database/mainframe.db')

app.use(express.urlencoded({extended:true}))

app.get('/',(req,res)=>{
    res.render('index',)
})
app.get('/register',(req,res)=>{
    res.render('register')
})

app.get('/personaldiary', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.redirect('/'); // Redirect to login if not logged in
    }

    // Fetch diary entries for the current user
    db.all('SELECT * FROM DiaryEntries WHERE user_id = ?', [userId], (err, entries) => {
        if (err) {
            return res.render('personaldiary', { error: 'Error fetching diary entries' });
        }
        entries.forEach(entry => {
            entry.date = new Date(entry.date);
        });
        res.render('personaldiary', { entries }); // Pass entries data to the view
    });
});
app.get('/viewentry/:id', (req, res) => {
    const entryId = req.params.id;

    // Fetch the entry from the database using entryId
    db.get('SELECT * FROM DiaryEntries WHERE id = ?', [entryId], (err, entry) => {
        if (err || !entry) {
            return res.status(404).render('error', { message: 'Entry not found' });
        }

        // Render the viewentry.ejs template with the entry data
        res.render('viewentry', { entry });
    });
});
// app.post('/adddiaryentry', (req, res) => {
//     const userId = req.session.userId;
//     const { title, entry, date } = req.body;

//     if (!userId) {
//         return res.redirect('/'); // Redirect to login if not logged in
//     }

//     // Convert the date string to a JavaScript Date object
//     const currentDate = date ? new Date(date) : new Date();

//     db.run('INSERT INTO DiaryEntries (user_id, title, date, entry) VALUES (?, ?, ?, ?)', [userId, title, currentDate, entry], (err) => {
//         if (err) {
//             return res.render('personaldiary', { error: 'Error adding diary entry' });
//         }

//         res.redirect('/personaldiary');
//     });
// // });

app.post('/adddiaryentry', (req, res) => {
    const userId = req.session.userId;
    const { title, entry, date } = req.body;

    if (!userId) {
        return res.redirect('/'); // Redirect to login if not logged in
    }

    // // Parse the date string
     const currentDate = moment(date).toDate();
     console.log('Date from form:', date);
     console.log('Parsed date:', currentDate);
// const currentDate = new Date(date);

    db.run('INSERT INTO DiaryEntries (user_id, title, date, entry) VALUES (?, ?, ?, ?)', [userId, title, currentDate, entry], (err) => {
        if (err) {
            return res.render('personaldiary', { error: 'Error adding diary entry' });
        }

        res.redirect('/personaldiary');
    });
});


// Add the following route for updating an entry
app.post('/updateentry/:id', (req, res) => {
    const entryId = req.params.id;
    const { editedEntry } = req.body;

    // Update the entry in the database with the edited content
    db.run('UPDATE DiaryEntries SET entry = ? WHERE id = ?', [editedEntry, entryId], (err) => {
        if (err) {
            return res.render('editentry', { entryId, error: 'Error updating entry' });
        }

        res.redirect('/personaldiary');
    });
});
// Add the following route for displaying the editentry form
app.get('/editentry/:id', (req, res) => {
    const entryId = req.params.id;

    // Fetch the entry from the database using entryId
    db.get('SELECT * FROM DiaryEntries WHERE id = ?', [entryId], (err, entry) => {
        if (err || !entry) {
            return res.status(404).render('error', { message: 'Entry not found' });
        }

        // Render the editentry.ejs template with the entry data
        res.render('editentry', { entry });
    });
});
// Add the following route for deleting an entry
app.post('/deleteentry/:id', (req, res) => {
    const entryId = req.params.id;

    // Delete the entry from the database based on the entryId
    db.run('DELETE FROM DiaryEntries WHERE id = ?', [entryId], (err) => {
        if (err) {
            return res.render('error', { message: 'Error deleting entry' });
        }

        res.redirect('/personaldiary');
    });
});

   app.post('/index', (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);

    db.get('SELECT id FROM Auth WHERE email = ? AND password = ?',
        [email, password],
        (err, user) => {
            if (err || !user) {
                return res.render('index', { error: 'Invalid email or password' });
            } 
            req.session.userId = user.id;
            
            res.redirect('/personaldiary');
        }
        
    );
});


app.post('/register',(req,res)=>{
    const{name,password,age,email} = req.body
    console.log(name,password,age,email)

    db.run(
        'INSERT INTO Auth (name, password, age, email) VALUES (?, ?, ?, ?)',
        [name, password, age, email],
        function (err) {
            if (err) {
                return res.render('register', { error: 'Registration failed' });
            }

            // Use the correct value of lastID
            const userId = this.lastID;

            // Store the new user's ID in the session
            req.session.userId = userId;

            res.redirect('/');
        }
    );
});

app.listen(port,()=>{
    console.log('server is running at http://localhost:3000')
})
