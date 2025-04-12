const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    jobTitle: String,
    companyName: String,
    link: String,
    site: String
});

// const jobSchema = new mongoose.Schema({
//     jobTitle: String,
//     listings: [{
//         companyName: String,
//         url: {
//             type: String,
//             unique: true
//         },
//     }],
//     site: String
// });
    

module.exports = mongoose.model('Job', jobSchema);