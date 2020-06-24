const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

console.log(process.env.NODE_ENV);

const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    //console.log(con.connections);
    console.log('Database Connection Successfull!');
  });

//START SERVER 🚉
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening to port ${port}..`);
});
