import { z } from 'zod';

// Match status constants
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

// Query schema for listing matches
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// Param schema for match ID
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Schema for creating a match
export const createMatchSchema = z
  .object({
    sport: z.string().min(1, 'Sport must be a non-empty string'),
    homeTeam: z.string().min(1, 'Home team must be a non-empty string'),
    awayTeam: z.string().min(1, 'Away team must be a non-empty string'),
    startTime: z.string().datetime('Invalid ISO date format for startTime'),
    endTime: z.string().datetime('Invalid ISO date format for endTime'),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be chronologically after start time',
  path: ['endTime'],
})

// Schema for updating match scores
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
