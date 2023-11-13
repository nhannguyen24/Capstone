// function isValidDateFormat(dateString) {
exports.isValidDateFormat = (dateString) => {
    let check = true;
    // Define a regular expression pattern for the ISO 8601 format
    const iso8601Pattern = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)$/;

    if (!iso8601Pattern.test(dateString)) {
        check = false;
        return check;
    }
    // Test the dateString against the regular expression
    return check;
}
