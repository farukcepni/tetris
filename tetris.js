function Tetris(container, next_container, row_count, col_count) {
    this.key = '';
    this.delay = 1000;
    this.lines = 0;
    this.score = 10;
    this.level = 1;
    this.score_values = {
        1: 1,
        2: 3,
        3: 5,
        4: 8
    }

    this.container = container;
    this.next_container = next_container;

    this.row_count = row_count;
    this.col_count = col_count;

    this.canvas = null;
    this.canvas_for_next = null;
    this.next = null;
    this.current = null;

    this.timer = null;
    this.is_playing = false;
    this.is_over = false;

    this.key_events = {
        37: 'move_left',
        38: 'rotate',
        39: 'move_right',
        40: 'move_down',
        32: 'set_down',
        80: 'toggle_play',

    };

    this.event_callbacks = {
        'score_update': null,
        'level_update': null,
        'pause': null,
        'play': null,
        'game_over': null,
    }

    this.constructor();
}

function Canvas(container, row_count, col_count) {
    this.key = '';
    this.container = container;
    this.row_count = row_count;
    this.col_count = col_count;

    this.canvas_el = 'ul';
    this.row_el = 'li';
    this.col_el = 'span';
    this.current_piece_class = 'current';
    this.settled_piece_class = 'settled';

    this.constructor();
}

function Piece() {
    this.name = '';
    this.positions = [];
    this.pos_index = 0;
    this.absolute_position = [];
    this.absolute_row = 0;
    this.absolute_col = 0;

    this.constructor();
}

Tetris.prototype = {
    constructor: function() {
        this.key = this.create_key();
        this.start_new();

        window.addEventListener('keydown', (
            function(self){
                return function(e) {
                    return self.control_keys(e);
                }
            })(this));
    },

    add_event_listener: function(event, callback) {
        this.event_callbacks[event] = callback;
    },

    call_listener: function(event) {
        if (this.event_callbacks[event] != null) {
            this.event_callbacks[event]();
        }
    },

    toggle_play: function() {
        if (this.is_playing) {
            this.pause();
        } else {
            this.play();
        }
    },

    update_score: function(line_count) {
        this.lines += line_count
        this.score += this.score_values[line_count];
        this.call_listener('score_update');
    },

    update_level: function(new_level) {
        this.level = new_level;
        this.call_listener('level_update');

        if (this.delay >= 100) {
            this.delay = 1000 - (this.level * 50);
            this.set_timer();
        }
    },

    check_level: function() {
        new_level = Math.ceil(this.score / 100);
        if (new_level > this.level) {
            this.update_level(new_level);
        }
    },

    create_key: function() {
        return 'Tetris-' + create_random_key(6, false, false, true);
    },

    control_keys: function(e){
        e = e || window.event;
        if (e.keyCode in this.key_events){
            this[this.key_events[e.keyCode]]();
            return false;
        }

        return true
    },

    set_current_piece: function() {
        this.current = this.next;

        this.current.absolute_row = -2;
        this.current.absolute_col = parseInt(this.col_count / 2);
        this.current.absolute_position = this.current.get_current_position();
        this.current.absolute_position = this.current.get_new_position(
                this.current.absolute_row, parseInt(this.col_count / 2));
        this.current.col =
        this.set_next_piece();
    },

    set_next_piece: function() {
        this.next = Pieces.select_one();
        this.canvas_for_next.move_piece(this.next.get_current_position());
    },

    set_timer: function() {
        if (this.timer != null) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(
            (function(self) {
                return function() {
                    return tetris.move_down();
                }
            }(this)), this.delay
        );
    },

    start_new: function() {
        this.score = 0;
        this.level = 1;
        this.is_playing = true;
        this.set_timer()
        this.call_listener('score_update');
        this.call_listener('level_update');
        this.canvas = new Canvas(this.container, this.row_count, this.col_count);
        this.canvas_for_next = new Canvas(this.next_container, 4, 4);

        this.set_next_piece();
        this.set_current_piece();
        this.call_listener('play');
    },

    play: function() {
        this.set_timer();
        this.is_playing = true;
        this.call_listener('play');
    },

    pause: function() {
        clearInterval(this.timer);
        this.is_playing = false;
        this.call_listener('pause');
    },

    is_game_over: function() {
        var el = document.querySelectorAll(this.canvas.get_settled_piece_selector(0));
        return el.length > 0;
    },

    over_game: function() {
        clearInterval(this.timer);
        this.is_playing = false;
        this.is_over = true;
        this.call_listener('game_over');
    },

    move_piece: function() {
        this.canvas.move_piece(tetris.current.absolute_position);
    },

    rotate: function() {
        var next_pos = this.current.get_next_absolute_position();
        if (this.canvas.is_available(next_pos)) {
            this.current.rotate();
            this.move_piece();
        }
    },

    move: function(row, col) {
        if (this.canvas.is_available(this.current.get_new_position(row, col))) {
            this.current.move(row, col);
            this.move_piece();
            return true;
        }
        return false;
    },

    move_down: function() {
        if (this.is_playing == false) {
            return false;
        }

        if (this.move(1, 0) == true) {
            return true;
        }

        this.canvas.piece_to_canvas();

        if (this.is_game_over()) {
            this.over_game();
            return false;
        }
        var completed_rows = this.canvas.get_completed_rows();
        if (completed_rows.length > 0) {
            this.update_score(completed_rows.length);
            this.check_level();
            this.canvas.complete_rows(completed_rows);
        }

        this.set_current_piece();
        this.set_next_piece();
        return false;
    },

    move_left: function() {
        return this.move(0, -1);
    },

    move_right: function() {
        return this.move(0, 1);
    },

    set_down: function() {
        while (this.move_down()){}
    }
};

Canvas.prototype = {
    constructor: function() {
        this.key = this.create_key();
        document.getElementById(this.container).innerHTML = this.get().outerHTML;
    },

    create_key: function() {
        return 'canvas-' + create_random_key(6, false, false, true);
    },

    is_available: function(position) {
        var row, col;
        for (var i = 0; i < position.length; i++) {
            row = position[i][0];
            col = position[i][1];

            if (col < 0 || col > this.col_count - 1 || row > this.row_count - 1) {
                return false;
            }
            if (document.querySelector(this.get_settled_piece_selector(row, col))) {
                return false;
            }
        }
        return true;
    },

    get_completed_rows: function() {
        var completed_rows = [];
        for (var row = 0; row < this.row_count; row++) {
            var els = document.querySelectorAll(this.get_settled_piece_selector(row));
            if (els.length == this.col_count) {
                completed_rows.push(row);
            }
        }
        return completed_rows;
    },

    clean_row: function(row) {
        var els = document.querySelectorAll(this.get_settled_piece_selector(row));
        for (var i = 0; i < els.length; i++) {
            els[i].classList.remove(this.settled_piece_class);
            els[i].classList.remove(this.current_piece_class);
        }
    },

    complete_rows: function(rows) {
        var j, t, el, settled_els;

        for (var i = 0; i < rows.length; i++) {
            this.clean_row(rows[i]);
            for (j = rows[i] - 1; j >= 0; j--) {
                settled_els = document.querySelectorAll(this.get_settled_piece_selector(j));
                for (t = 0; t < settled_els.length; t++) {
                    el = settled_els[t];
                    el.classList.remove(this.settled_piece_class);
                    var selector = '.cell_' + (j + 1) + '_' + el.getAttribute('data-col');
                    document.querySelector(selector).classList.add(this.settled_piece_class);

                }
            }
        }
    },

    piece_to_canvas: function() {
        var elements = document.querySelectorAll(this.get_current_piece_selector());
        for (var i = 0; i < elements.length; i++) {
            elements[i].classList.remove(this.current_piece_class);
            elements[i].classList.add(this.settled_piece_class);
        }
    },

    move_piece: function(new_positions) {
        var row, col, i, el;
        el = document.querySelectorAll(this.get_current_piece_selector());
        for (i = 0; i < el.length; i++) {
            el[i].classList.remove(this.current_piece_class);
        }

        for (i in new_positions) {
            row = new_positions[i][0];
            col = new_positions[i][1];
            el = document.querySelector('#' + this.key + ' .cell_' + row + '_' + col);
            if (el){
                el.classList.add(this.current_piece_class);
            }
        }
    },

    get_current_piece_selector: function() {
        return '#' + this.key + ' .' + this.current_piece_class;
    },

    get_settled_piece_selector: function(row, col) {
        var selector = '';
        if (row != undefined) {
            selector += '[data-row="' + row + '"] ';
        }
        if (col != undefined) {
            selector += '[data-col="' + col + '"]';
        }
        selector += '.' + this.settled_piece_class;
        return selector;
    },

    get: function() {
        if (this.__canvas == undefined) {
            this.__canvas = this.create_canvas();
        }
        return this.__canvas;
    },

    create_canvas: function() {
        var row_el, col_el;
        var canvas_el = this.create_canvas_element();

        for (var row = 0; row < this.row_count; row++) {
            row_el = this.create_row_element(row);
            for (var col = 0; col < this.col_count; col++) {
                col_el = this.create_col_element(row, col);
                row_el.appendChild(col_el);
            }
            canvas_el.appendChild(row_el);
        }
        return canvas_el;
    },

    create_canvas_element: function() {
        return create_element(this.canvas_el, {
            'id': this.key,
            'class': 'canvas ' + this.key.replace('-', '_')
        });
    },

    create_row_element: function(row) {
        return create_element(this.row_el, {
            'id': 'row_' + row,
            'class': 'row row_' + row,
            'data-row': row
        });
    },

    create_col_element: function(row, col) {
        var el = create_element(this.col_el, {
            'id': 'cell_' + row + '_' + col,
            'class': 'cell col_' + col + ' row_' + row + ' cell_' + row + '_' + col,
            'data-row': row,
            'data-col': col
        });

        var inline = create_element('em', {
            'id': 'inline_cell_'+ row + '_' + col,
            'class': 'inline_cell'
        })

        el.appendChild(inline);
        return el;
    }

};

Piece.prototype = {
    constructor: function() {

    },

    move: function(row, col) {
        this.absolute_position = this.get_new_position(row, col);
        this.absolute_row = this.absolute_row + row;
        this.absolute_col = this.absolute_col + col;
    },

    rotate: function() {
        this.absolute_position = this.get_next_absolute_position();
        this.set_pos_index(this.get_next_pos_index());
    },

    get_new_position: function(row, col) {
        var position = [];

        for (var pos in this.absolute_position) {
            position.push([this.absolute_position[pos][0] + row,
                           this.absolute_position[pos][1] + col]);
        }
        return position
    },

    get_next_absolute_position: function() {
        var position = [];
        var next_position = this.get_next_position();
        var absolute_row = this.absolute_row;
        var absolute_col = this.absolute_col;
        for (var pos in next_position) {
            position.push([next_position[pos][0] + absolute_row,
                           next_position[pos][1] + absolute_col]);
        }
        return position;
    },

    get_current_position: function() {
        return this.positions[this.pos_index];
    },

    get_next_position: function() {
        return this.positions[this.get_next_pos_index()];
    },

    get_position_count: function() {
        return this.positions.length;
    },

    get_next_pos_index: function() {
        if (this.pos_index == this.get_position_count() - 1) {
            return 0;
        }
        return this.pos_index + 1;
    },

    set_name: function(name) {
        this.name = name;
        return this;
    },

    set_positions: function(positions) {
        this.positions = positions;
        return this;
    },

    set_pos_index: function(pos_index) {
        var is_index_valid = pos_index < this.get_position_count();
        this.pos_index = is_index_valid ? pos_index : 0;
        return this;
    }
};

Pieces = {
    pieces: 'OIZTLSJ',

    O: [[[0, 0], [0, 1], [1, 0], [1, 1]]],

    I: [[[0, 0], [1, 0], [2, 0], [3, 0]],
        [[1, 0], [1, 1], [1, 2], [1, 3]]],

    Z: [[[0, 0], [0, 1], [1, 1], [1, 2]],
        [[0, 1], [1, 1], [1, 0], [2, 0]]],

    T: [[[0, 0], [0, 1], [0, 2], [1, 1]],
        [[0, 0], [1, 0], [2, 0], [1, 1]],
        [[1, 1], [2, 0], [2, 1], [2, 2]],
        [[1, 1], [0, 2], [1, 2], [2, 2]]],

    L: [[[0, 1], [1, 1], [2, 1], [2, 2]],
        [[1, 0], [1, 1], [1, 2], [0, 2]],
        [[0, 0], [1, 1], [0, 1], [2, 1]],
        [[1, 0], [1, 1], [1, 2], [2, 0]]],

    S: [[[1, 1], [0, 1], [1, 0], [2, 0]],
        [[1, 1], [1, 0], [2, 1], [2, 2]]],

    J: [[[1, 1], [0, 1], [2, 1], [2, 0]],
        [[1, 1], [1, 0], [1, 2], [2, 2]],
        [[1, 1], [0, 1], [0, 2], [2, 1]],
        [[1, 1], [0, 0], [1, 0], [1, 2]]],

    get_piece_count: function() {
        return Pieces.pieces.length;
    },

    select_one: function() {
        var piece_name = this.pieces[create_random_number(this.get_piece_count())];
        var pos_index = create_random_number(Pieces[piece_name].length);

        var piece = new Piece();
        piece.set_name(piece_name)
             .set_positions(Pieces[piece_name])
             .set_pos_index(pos_index);
        return piece;
    }
};