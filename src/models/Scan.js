const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
    plantId: {
        type: String,
        required: true
    },
    disease: {
        type: String,
        required: true
    },
    dateScanned: {
        type: Date,
        default: Date.now
    },
    location: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        default: ''
    }
});

const Scan = mongoose.model('Scan', scanSchema);

module.exports = Scan;
