import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
  foreignKey,
} from 'drizzle-orm/pg-core';

// Define the match_status enum
export const matchStatusEnum = pgEnum('match_status', [
  'scheduled',
  'live',
  'finished',
]);

// Matches table
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  sport: text('sport').notNull(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  status: matchStatusEnum('status')
    .notNull()
    .default('scheduled'),
  startTime: timestamp('start_time', { mode: 'date' }).notNull(),
  endTime: timestamp('end_time', { mode: 'date' }),
  homeScore: integer('home_score')
    .notNull()
    .default(0),
  awayScore: integer('away_score')
    .notNull()
    .default(0),
  createdAt: timestamp('created_at', { mode: 'date' })
    .notNull()
    .defaultNow(),
});

// Commentary table
export const commentary = pgTable(
  'commentary',
  {
    id: serial('id').primaryKey(),
    matchId: integer('match_id').notNull(),
    minute: integer('minute'),
    sequence: integer('sequence').notNull(),
    period: text('period'),
    eventType: text('event_type').notNull(),
    actor: text('actor'),
    team: text('team'),
    message: text('message').notNull(),
    metadata: jsonb('metadata'),
    tags: text('tags').array(),
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    matchIdFk: foreignKey({
      columns: [table.matchId],
      foreignColumns: [matches.id],
    }),
  })
);

// Types
// export type MatchType = typeof matches.$inferSelect;

// export type NewMatchType = typeof matches.$inferInsert;

// export type CommentaryType = typeof commentary.$inferSelect;

// export type NewCommentaryType = typeof commentary.$inferInsert;