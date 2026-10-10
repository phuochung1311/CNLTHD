const { z } = require('zod');

const createAssignment = {
    body: z.object({
        classId: z.number().int().positive(),
        teacherId: z.number().int().positive(),
    }),
};

const idParam = {
    params: z.object({
        id: z.coerce.number().int().positive(),
    }),
};

module.exports = { createAssignment, idParam };