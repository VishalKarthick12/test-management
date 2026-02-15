const xlsx = require('xlsx');

const parseExcelRequest = (buffer) => {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Assuming Row 1 is headers (Question, Options, Correct Answer)
    // Data starts from index 1.
    const questions = [];

    // Skip header row
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const questionText = row[0];
        const optionsRaw = row[1];
        const correctAnswer = row[2];

        if (!questionText || !optionsRaw || !correctAnswer) continue;

        const options = optionsRaw.split('|').map(opt => opt.trim());
        let type = 'MCQ';

        // simple detection strategy
        if (options.length === 2 &&
            (options.includes('True') || options.includes('False') ||
                options.includes('true') || options.includes('false'))) {
            type = 'True/False';
        }

        questions.push({
            text: questionText,
            type: type,
            options: options,
            correctAnswer: correctAnswer,
        });
    }

    return questions;
};

module.exports = { parseExcelRequest };
