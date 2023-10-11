const path = require('path');

const downloadTourTemplate = async (req, res) => {
    try{
        const fileName = 'Tour create.xlsx';
        const filePath = path.join(__dirname, `../template/${fileName}`);
        res.download(filePath);
    } catch(error){
        console.log(error)
    }
}

module.exports = {downloadTourTemplate}