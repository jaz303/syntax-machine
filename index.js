const def = {
    initialState: 'main',
    states: {
        main: {
            skip: /^\s+/,
            tokens: [
                {
                    pattern: /^(int|float|char|void|break|for|while|do)/,
                    actions: [
                        ['apply-class', 'keyword']
                    ]
                },
                {
                    pattern: /^\w+/,
                    actions: [
                        ['apply-class', 'ident']
                    ]
                },
                {
                    pattern: /^"/,
                    actions: [
                        ['apply-class', 'string'],
                        ['enter-state', 'string']
                    ]
                },
                {
                    pattern: /^[\(\)\{\},\[\];]/,
                    actions: []
                },
            ]
        },
        string: {
            tokens: [
                {
                    pattern: /^"/,
                    actions: [
                        ['apply-class', 'string'],
                        ['enter-state', 'main']
                    ]
                }
            ]
        }   
    }
};

const src = require('fs').readFileSync('main.c', 'utf8')

function highlight(machine, src) {
    
    function createInitialState() {
        return {
            state: machine.initialState
        };
    }

    function highlightLine(line, state) {
        const output = [];
        let rules = machine.states[state.state];
        let pos = 0;
        let m;
        while (line.length) {
            if (rules.skip && (m = line.match(rules.skip))) {
                const len = m[0].length;
                line = line.substr(len);

                pos += len;
            } else {
                let matched = false;
                for (let i = 0; i < rules.tokens.length; ++i) {
                    if ((m = line.match(rules.tokens[i].pattern))) {
                        const len = m[0].length;
                        line = line.substr(len);
                        const actions = rules.tokens[i].actions;
                        for (let j = 0; j < actions.length; ++j) {
                            const action = actions[j];
                            switch (action[0]) {
                                case 'apply-class':
                                    output.push(['class', action[1], pos, len]);
                                    break;
                                case 'enter-state':
                                    state.state = action[1];
                                    rules = machine.states[state.state];
                                    break;
                            }
                        }
                        pos += len;
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    line = line.substr(1);
                    pos++;
                }
            }
        }
        return {
            output: output,
            state: state
        };
    }

    let state = createInitialState();
    src.split("\n").forEach((line) => {
        const result = highlightLine(line, state);
        console.log(result.output);
        state = result.state;
    });

}

highlight(def, src)