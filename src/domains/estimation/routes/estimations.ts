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

interface BuildingFactors {
  concrete: number;
  masonry: number;
  metal: number;
  'wood and plastic': number;
  'thermal and moisture': number;
  openings: number;
  finishes: number;
  specialites: number;
  furnishing: number;
  HVAC: number;
  electrical: number;
  plumbing: number;
  fire: number;
  'conveying equipment': number;
  'special construction': number;
  equipment: number;
  buildingCost?: number; // Add the new property
}

interface SiteWorkFactors {
  siteWorkCost?: number;
  Earthwork: number;
  'Exterior Improvements': number;
  utilities: number;
}

interface GeneralFactors {
  'GC Charges': number;
  generalFactorsCost?: number;
}

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Locations = repo(Location);
  app.register(ResponseShape);

  app.route({
    method: 'POST',
    url: '/generic',
    schema: {
      body: Type.Pick(EstimationSchema, [
        'zipCode',
        'rooms',
        'kingStudioQuantity',
        'kingOneQuantity',
        'doubleQueenQuantity',
        'adaQuantity',
        'floors',
        'perimeter',
        'totalSqFt',
      ]),
    },
    async handler(req) {
      const {
        rooms = 28,
        zipCode,
        kingStudioQuantity = 125,
        kingOneQuantity = 5,
        doubleQueenQuantity = 20,
        adaQuantity = 9,
        floors = 4,
      } = req.body;

      let { totalSqFt, perimeter } = req.body;
      let factor = (
        await Locations.findOne({
          where: {
            zipCode,
          },
        })
      )?.factor;

      if (!factor) factor = 100;

      factor = factor / 100;

      if (!totalSqFt || totalSqFt === 0)
        totalSqFt =
          (kingStudioQuantity * 348 +
            kingOneQuantity * 539 +
            doubleQueenQuantity * 437 +
            adaQuantity * 575) *
          1.43;

      if (!perimeter) perimeter = (totalSqFt / floors) * 0.0428;
      const concrete =
        (-24617.88 -
          341.03 * rooms -
          2524.81 * floors +
          4.51 * totalSqFt +
          426.32 * perimeter) *
        factor;
      const masonry = (4445.41 + 341.95 * rooms + 22543 * floors) * factor;
      const metal = 2.82 * totalSqFt * factor;
      const woodAndPlastic =
        (-735068.73 -
          50789.21 * rooms -
          336022.34 * floors +
          171.58 * totalSqFt +
          346.92 * perimeter) *
        factor;
      const thermalAndMoisture =
        (-84076.81 -
          1042.58 * rooms +
          14297.25 * floors +
          11.98 * totalSqFt +
          473.33 * perimeter) *
        factor;
      const openings =
        (115717.36 +
          2829.97 * rooms +
          3221.5 * floors +
          4.91 * totalSqFt +
          1.65 * perimeter) *
        factor;

      const finishes =
        (-1444106.64 -
          101008.92 * rooms -
          697637.08 * floors +
          290.09 * totalSqFt +
          433.06 * perimeter) *
        factor;

      const specialites = 2196.52 * rooms * factor;

      const equipment = 16607.17 * factor;

      const furnishing = (47801.15 + 4927.26 * rooms) * factor;
      const specialConstruction = 42866.14 * factor;

      const conveyingEquipment = 263503.21 * factor;

      const fire =
        (10254.2 -
          75.09 * rooms +
          3176.98 * floors +
          4.83 * totalSqFt +
          32.18 * perimeter) *
        factor;

      const plumbing =
        (153521.31 +
          8761.87 * rooms -
          2484.54 * floors +
          6.81 * totalSqFt +
          0.82 * perimeter) *
        factor;

      const HVAC = (403530.82 + 3909.31 * rooms) * factor;

      const electrical =
        (106136.19 + 2790.83 * rooms + 18.06 * totalSqFt) * factor;
      const earthWork =
        (-145700.47 -
          2018.41 * rooms -
          14943.03 * floors +
          5.13 * totalSqFt +
          935.03 * perimeter) *
        factor;

      const exteriorImprovements =
        (-191269.25 -
          2649.68 * rooms -
          19616.56 * floors +
          6.74 * totalSqFt +
          1135.46 * perimeter) *
        factor;
      const utilities =
        (-195050.35 -
          2702.06 * rooms -
          20004.35 * floors +
          6.87 * totalSqFt +
          1157.9 * perimeter) *
        factor;
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
      const buildingFactors: BuildingFactors = {
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

      interface BuildingFactors {
        [key: string]: number; // Add index signature allowing indexing with a string
        // Define other properties and their types if needed
      }
      interface SiteWorkFactors {
        [key: string]: number; // Add index signature allowing indexing with a string
        // Define other properties and their types if needed
      }
      interface GeneralFactors {
        [key: string]: number; // Add index signature allowing indexing with a string
        // Define other properties and their types if needed
      }

      for (const key in buildingFactors) {
        buildingFactors[key] = parseInt(buildingFactors[key].toFixed(0));
      }

      const sumForBuilding: number = Object.values(buildingFactors).reduce(
        (acc, currentValue) => acc + currentValue,
        0,
      );

      buildingFactors.buildingCost = sumForBuilding;

      const siteWorkFactors: SiteWorkFactors = {
        Earthwork: earthWork,
        'Exterior Improvements': exteriorImprovements,
        utilities,
      };

      const sumForSiteWork: number = Object.values(siteWorkFactors).reduce(
        (acc, currentValue) => acc + currentValue,
        0,
      );

      siteWorkFactors.siteWorkCost = sumForSiteWork;

      for (const key in siteWorkFactors) {
        siteWorkFactors[key] = parseInt(siteWorkFactors[key].toFixed(0));
      }

      const generalFactors: GeneralFactors = {
        'GC Charges':
          (buildingFactors?.buildingCost + siteWorkFactors?.siteWorkCost) *
          0.18841,
      };
      const sumForGeneralFactors = Object.values(generalFactors).reduce(
        (acc, currentValue) => acc + currentValue,
        0,
      );

      generalFactors.generalFactorsCost =
        (buildingFactors?.buildingCost + siteWorkFactors?.siteWorkCost) *
        0.18841;

      for (const key in generalFactors) {
        generalFactors[key] = parseInt(generalFactors[key].toFixed(0));
      }

      const totalProjectCost =
        generalFactors.generalFactorsCost +
        siteWorkFactors.siteWorkCost +
        buildingFactors.buildingCost;

      const projectFactors = [
        {
          id: 1,
          name: 'Build Time',
          cost: Math.round(rooms / 8.33 + (rooms + (rooms > 100 ? 6 : 5))),
        },
        {
          id: 2,
          name: 'Cost Per Key',
          cost: Math.round(totalProjectCost / rooms),
        },
        {
          id: 3,
          name: 'Cost Per Square Foot',
          cost: Math.round(totalProjectCost / totalSqFt),
        },
        {
          id: 4,
          name: 'Total Project Cost',
          cost: Math.trunc(totalProjectCost),
        },
      ];

      if (!perimeter) perimeter = (totalSqFt / floors) * 0.0428;

      return {
        buildingFactors,
        siteWorkFactors,
        generalFactors,
        projectFactors,
      };
    },
  });
};

export default plugin;
