'use strict';

const db = require('./src/db');
const supabase = require('./src/supabase');

module.exports = {
  ...db,
  supabase,
};
