import { useTranslation } from 'react-i18next';

export interface Snippet {
  id: string;
  label: string;
  code: string;
  tooltip?: string;
}

export interface SnippetCategory {
  id: string;
  name: string;
  color: string;
  snippets: Snippet[];
}

export const useSnippets = (lang: string): SnippetCategory[] => {
  const { t } = useTranslation();

  // Normalize language key
  const language = lang === 'monaco' ? 'javascript' : lang;

  // --- HELPER FUNCTIONS FOR CODE GENERATION ---

  const call = (cmd: string, args: string = '') => {
    switch (language) {
      case 'python':
      case 'lua':
      case 'swift':
        return `${cmd}(${args})`;
      case 'cpp':
      case 'javascript':
      default:
        return `${cmd}(${args});`;
    }
  };

  const repeatLoop = (times: number) => {
    switch (language) {
      case 'python': return `for i in range(${times}):\n    pass`;
      case 'lua': return `for i = 1, ${times} do\nend`;
      case 'swift': return `for i in 0..<${times} {\n}`;
      case 'cpp': return `for (int i = 0; i < ${times}; i++) {\n}`;
      case 'javascript': default: return `for (let i = 0; i < ${times}; i++) {\n}`;
    }
  };

  const whileLoop = (cond: string) => {
    switch (language) {
      case 'python': return `while ${cond}:\n    pass`;
      case 'lua': return `while ${cond} do\nend`;
      case 'swift': return `while ${cond} {\n}`;
      case 'cpp':
      case 'javascript': default: return `while (${cond}) {\n}`;
    }
  };

  const ifStmt = (cond: string) => {
    switch (language) {
      case 'python': return `if ${cond}:\n    pass`;
      case 'lua': return `if ${cond} then\nend`;
      case 'swift': return `if ${cond} {\n}`;
      case 'cpp':
      case 'javascript': default: return `if (${cond}) {\n}`;
    }
  };

  // --- MATH SNIPPETS ---
  const mathRandom = () => {
    switch (language) {
      case 'python': return 'random.random()';
      case 'lua': return 'math.random()';
      case 'swift': return 'Double.random(in: 0...1)';
      case 'cpp': return 'std::rand()';
      case 'javascript': default: return 'Math.random()';
    }
  };

  const mathRound = (arg: string = 'x') => {
    switch (language) {
      case 'python': return `round(${arg})`;
      case 'lua': return `math.floor(${arg} + 0.5)`;
      case 'swift': return `round(${arg})`;
      case 'cpp': return `std::round(${arg})`;
      case 'javascript': default: return `Math.round(${arg})`;
    }
  };

  const mathMin = (a: string = 'a', b: string = 'b') => {
    switch (language) {
      case 'python': return `min(${a}, ${b})`;
      case 'lua': return `math.min(${a}, ${b})`;
      case 'swift': return `min(${a}, ${b})`;
      case 'cpp': return `std::min(${a}, ${b})`;
      case 'javascript': default: return `Math.min(${a}, ${b})`;
    }
  };

  // --- ARRAY SNIPPETS ---
  const arrCreate = () => {
    switch (language) {
      case 'python': return 'arr = []';
      case 'lua': return 'arr = {}';
      case 'swift': return 'var arr = [Int]()';
      case 'cpp': return 'std::vector<int> arr;';
      case 'javascript': default: return 'let arr = [];';
    }
  };

  const arrLen = (arr: string = 'arr') => {
    switch (language) {
      case 'python': return `len(${arr})`;
      case 'lua': return `#${arr}`;
      case 'swift': return `${arr}.count`;
      case 'cpp': return `${arr}.size()`;
      case 'javascript': default: return `${arr}.length`;
    }
  };

  const arrPush = (arr: string = 'arr', val: string = 'val') => {
    switch (language) {
      case 'python': return `${arr}.append(${val})`;
      case 'lua': return `table.insert(${arr}, ${val})`;
      case 'swift': return `${arr}.append(${val})`;
      case 'cpp': return `${arr}.push_back(${val});`;
      case 'javascript': default: return `${arr}.push(${val});`;
    }
  };
  
  const arrGet = (arr: string = 'arr', idx: string = '0') => {
      // Lua 1-based index handled generically or specifically? Keeping simple for now.
      if (language === 'lua' && idx === '0') idx = '1';
      return `${arr}[${idx}]`;
  };

  // --- TEXT SNIPPETS ---
  const textLen = (str: string = 'str') => {
    switch (language) {
      case 'python': return `len(${str})`;
      case 'lua': return `#${str}`;
      case 'swift': return `${str}.count`;
      case 'cpp': return `${str}.length()`;
      case 'javascript': default: return `${str}.length`;
    }
  };

  const textConcat = (a: string = 'str1', b: string = 'str2') => {
     switch (language) {
        case 'lua': return `${a} .. ${b}`;
        default: return `${a} + ${b}`;
     }
  };

  const textParseInt = (str: string = 'str') => {
      switch(language) {
          case 'python': return `int(${str})`;
          case 'lua': return `tonumber(${str})`;
          case 'swift': return `Int(${str}) ?? 0`;
          case 'cpp': return `std::stoi(${str})`;
          case 'javascript': default: return `parseInt(${str})`;
      }
  }


  return [
    {
      id: 'movement',
      name: t('Games.catMovement'),
      color: '#CF63CF',
      snippets: [
        { id: 'move', label: t('Maze.moveForward'), code: call('moveForward') },
        { id: 'turnLeft', label: t('Maze.turnLeft'), code: call('turnLeft') },
        { id: 'turnRight', label: t('Maze.turnRight'), code: call('turnRight') },
        { id: 'jump', label: t('Maze.jump'), code: call('jump') },
      ]
    },
    {
      id: 'actions',
      name: t('Games.catActions'),
      color: '#A5745B',
      snippets: [
        { id: 'collect', label: t('Maze.collectItem', 'Collect'), code: call('collect') },
        { id: 'switch', label: t('Maze.toggleSwitch', 'Toggle Switch'), code: call('toggleSwitch') },
        { id: 'say', label: t('Maze.say', 'Say'), code: call('say', '"Hello"') },
        { id: 'wait', label: t('Maze.wait', 'Wait'), code: call('wait', '1') },
        { id: 'say_for', label: `${t('Maze.say', 'Say')} ${t('Maze.for', 'For')}...`, code: `${call('say', '"Hello"')}\n${call('wait', '1')}\n${call('say', '""')}` },
      ]
    },
    {
      id: 'loops',
      name: t('Games.catLoops'),
      color: '#5BA55B',
      snippets: [
        { id: 'repeat_5', label: t('Maze.repeat', 'Repeat 5'), code: repeatLoop(5) },
        { id: 'while_path', label: 'While Path Ahead', code: whileLoop('isPathForward()') },
        { id: 'while_not_done', label: 'While Not Finished', code: whileLoop('!atFinish()') },
      ]
    },
    {
      id: 'logic',
      name: t('Games.catLogic'),
      color: '#5B80A5',
      snippets: [
         { id: 'if_path', label: 'If Path Ahead', code: ifStmt('isPathForward()') },
         { id: 'if_path_left', label: 'If Path Left', code: ifStmt('isPathLeft()') },
         { id: 'if_path_right', label: 'If Path Right', code: ifStmt('isPathRight()') },
      ]
    },
    {
      id: 'math',
      name: t('Games.catMath', 'Math'),
      color: '#7C4DFF', // Deep Purple
      snippets: [
          { id: 'math_random', label: 'Random', code: mathRandom() },
          { id: 'math_round', label: 'Round', code: mathRound() },
          { id: 'math_min', label: 'Min', code: mathMin() },
          { id: 'math_max', label: 'Max', code: mathMin().replace('min', 'max') }, // Lazy replacement
          { id: 'math_op_plus', label: 'Add (+)', code: 'a + b' },
          { id: 'math_op_mult', label: 'Multiply (*)', code: 'a * b' },
      ]
    },
    {
      id: 'arrays',
      name: t('Games.catArrays', 'Arrays'),
      color: '#E65100', // Dark Orange
      snippets: [
          { id: 'arr_create', label: 'Create', code: arrCreate() },
          { id: 'arr_len', label: 'Length', code: arrLen() },
          { id: 'arr_get', label: 'Get', code: arrGet() },
          { id: 'arr_set', label: 'Set', code: `${arrGet()} = value` },
          { id: 'arr_push', label: 'Push/Append', code: arrPush() },
      ]
    },
    {
      id: 'text',
      name: t('Games.catText', 'Text'),
      color: '#F9A825', // Gold
      snippets: [
          { id: 'text_len', label: 'Length', code: textLen() },
          { id: 'text_concat', label: 'Concat', code: textConcat() },
          { id: 'text_parseint', label: 'Parse Int', code: textParseInt() },
          { id: 'text_compare', label: 'Compare', code: 'str1 == str2' },
      ]
    },
    {
      id: 'oop',
      name: 'OOP',
      color: '#9370DB',
      snippets: [
        { id: 'r1_move', label: 'Robot 1: Move', code: call('robot1.moveForward') },
        { id: 'r1_left', label: 'Robot 1: Turn Left', code: call('robot1.turnLeft') },
        { id: 'r1_right', label: 'Robot 1: Turn Right', code: call('robot1.turnRight') },
        { id: 'r1_say', label: 'Robot 1: Say', code: call('robot1.say', '"Hello"') },
        { id: 'r2_move', label: 'Robot 2: Move', code: call('robot2.moveForward') },
        { id: 'r2_left', label: 'Robot 2: Turn Left', code: call('robot2.turnLeft') },
        { id: 'r2_right', label: 'Robot 2: Turn Right', code: call('robot2.turnRight') },
      ]
    }
  ];
};
