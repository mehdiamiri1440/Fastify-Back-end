import { EstimationSchema } from '$src/domains/estimation/schemas/estimation.schema';
import { Location } from '$src/domains/locations/models/Location';
import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Like } from 'typeorm';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Locations = repo(Location);
  app.register(ResponseShape);

  app.route({
    method: 'POST',
    url: '/generic',
    schema: {
      body: Type.Pick(EstimationSchema, ['zipCode', 'rooms']),
    },
    async handler(req) {
      const { rooms, zipCode } = req.body;

      let factor = (
        await Locations.findOne({
          where: {
            zipCode,
          },
        })
      )?.factor;

      if (!factor) factor = 1;

      factor = factor / 100;

      const concrete = (226849 + 1521 * rooms) * factor;
      const masonry = (24124 + 885 * rooms) * factor;
      const metal = (23809 + 1073 * rooms) * factor;
      const woodAndPlastic = (271590 + 17845 * rooms) * factor;
      const thermalAndMoisture = (271317 + 4396 * rooms) * factor;
      const openings = (156429 + 5587 * rooms) * factor;
      const finishes = (390178 + 14040 * rooms) * factor;
      const specialites = (0 + 1872 * rooms) * factor;
      const equipment = 14000 * factor;
      const furnishing = (50000 + 4522 * rooms) * factor;
      const specialConstruction = 36460 * factor;
      const conveyingEquipment = 248468 * factor;
      const fire = (70156 + 1865 * rooms) * factor;
      const plumbing = (173031 + 10637 * rooms) * factor;
      const HVAC = (333066 + 3500 * rooms) * factor;
      const electrical = (253168 + 9530 * rooms) * factor;
      const earthWork = (378261 + 152 * rooms) * factor;
      const exteriorImprovements = 537776 * factor;
      const utilities = 548407 * factor;
      const generalRequirements =
        (0.064 +
          (concrete +
            masonry +
            metal +
            woodAndPlastic +
            thermalAndMoisture +
            openings +
            finishes +
            specialites +
            furnishing +
            earthWork +
            HVAC +
            electrical +
            exteriorImprovements +
            utilities +
            plumbing +
            fire +
            conveyingEquipment +
            specialConstruction +
            equipment) *
            rooms) *
        factor;
      const softChargesAndFees =
        (0.0117 +
          (concrete +
            masonry +
            metal +
            woodAndPlastic +
            thermalAndMoisture +
            openings +
            finishes +
            specialites +
            furnishing +
            earthWork +
            HVAC +
            electrical +
            exteriorImprovements +
            utilities +
            plumbing +
            fire +
            conveyingEquipment +
            specialConstruction +
            equipment +
            generalRequirements) *
            rooms) *
        factor;
      const buildingFactors = {
        concrete,
        masonry,
        metal,
        'wood and plastic': woodAndPlastic,
        'thermal and moisture': thermalAndMoisture,
        openings,
        finishes,
        specialites,
        furnishing,
        HVAC,
        electrical,
        plumbing,
        fire,
        'conveying equipment': conveyingEquipment,
        'special construction': specialConstruction,
        equipment,
      };

      return {
        buildingFactors,
        siteWorkFactors: {
          'earth work': earthWork,
          'exterior improvements': exteriorImprovements,
          utilities,
        },
        generalFactors: {
          'general requirements': generalRequirements,
          'soft charges and fees': softChargesAndFees,
        },
      };
    },
  });
};

export default plugin;
