export const removeEmojis = (text) => {
    if (typeof text !== 'string') {
        throw new TypeError('Input must be a string');
    }

    // Regex to match most emojis (including multi-codepoint)
    return text.replace(
        /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF])/g,
        ''
    );
}