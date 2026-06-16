/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports.up = async (knex) => {
  await knex.schema.alterTable('card', (table) => {
    table.json('recurrence');
  });
};

module.exports.down = (knex) =>
  knex.schema.alterTable('card', (table) => {
    table.dropColumn('recurrence');
  });
