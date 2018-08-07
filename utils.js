function create_random_number(max) {
    return Math.floor(Math.random() * max);
}

function create_random_key(char_count, lower_case, upper_case, numeric) {
    var chars = '';
    var created_chars = [];
    var charset = {
        LOWER: 'abcdefghijklmnoprstuvwxyz',
        UPPER: 'ABCDEFGHIJKLMNOPRSTUVWXYZ',
        NUMERIC: '0123456789'
    };

    if (!(lower_case || upper_case || numeric)) {
        lower_case = upper_case = numeric = true
    }

    chars += lower_case ? charset.LOWER : '';
    chars += upper_case ? charset.UPPER : '';
    chars += numeric ? charset.NUMERIC : '';

    for (var i=0; i < char_count; i++) {
        created_chars.push(chars[create_random_number(chars.length)])
    }
    return created_chars.join('');
}

function create_element(element_type, attrs, styles) {
    var el = document.createElement(element_type);
    for (var name in attrs) {
        el.setAttribute(name, attrs[name]);
    }
    for (name in styles) {
        el.style[name] = styles[name];
    }
    return el;
}