import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../models'

export default {

  method: 'get',
  path: '/titles?/:tokenId',

  parameters: Joi.object().keys({

    include: Joi.array().items(
      Joi.string().valid('metadata', 'provenance'),
    ).single().default([]),

    includeOrder: Joi.object().keys({
      provenance: Joi.string().valid('createdAt', '-createdAt'),
    }).default({
      provenance: '-createdAt',
    }),

  }),

  handler(request, response) {

    // even though this is a public route, business logic dictates that we
    //  should not return provenance if the user isn't logged in
    if (!response.locals.userAddress) {
      request.parameters.include = request.parameters.include.filter((include) => {
        return include !== 'provenance'
      })
    }

    const populateConditions = request.parameters.include.map((include) => {
      return {
        path: include,
        options: {
          sort: request.parameters.includeOrder[include],
        },
      }
    })

    return models.CodexTitle.findById(request.params.tokenId)
      .populate(populateConditions)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new RestifyErrors.NotFoundError(`CodexTitle with tokenId ${request.params.tokenId} does not exist.`)
        }

        codexTitle.applyPrivacyFilters(response.locals.userAddress)

        return codexTitle

      })

  },

}
