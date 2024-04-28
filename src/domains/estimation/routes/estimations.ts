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
        rooms = 100,
        zipCode,
        // kingStudioQuantity = 125,
        // kingOneQuantity = 5,
        // doubleQueenQuantity = 20,
        // adaQuantity = 9,
        // floors = 4,
      } = req.body;

      let {
        floors,
        kingOneQuantity,
        doubleQueenQuantity,
        kingStudioQuantity,
        adaQuantity,
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

      floors = Math.ceil(rooms / 28);
      kingOneQuantity = floors * 2;
      doubleQueenQuantity = (floors - 1) * 5 + 1;
      kingStudioQuantity = rooms - doubleQueenQuantity - kingOneQuantity;
      adaQuantity = floors * 2 - 1;

      totalSqFt = Math.round(
        (kingStudioQuantity * 348 +
          kingOneQuantity * 539 +
          doubleQueenQuantity * 437 +
          adaQuantity * 574.55) *
          1.34,
      );

      perimeter = Math.round((totalSqFt / floors) * 0.0417);
      const concrete =
        (-475509.38 +
          219961.44 * rooms +
          1242638.31 * floors -
          468.33 * totalSqFt +
          277.93 * perimeter) *
        factor;
      const masonry = (4445.41 + 341.95 * rooms + 22543 * floors) * factor;

      const metal =
        (-1389740.59 +
          542772.14 * rooms +
          3071726.56 * floors -
          1160.71 * totalSqFt -
          72.62 * perimeter) *
        factor;
      const woodAndPlastic =
        (-83620146.59 +
          32357973.52 * rooms +
          183074744.89 * floors -
          69302.99 * totalSqFt -
          4084.57 * perimeter) *
        factor;
      const thermalAndMoisture =
        (-4086094.85 +
          1609683.75 * rooms +
          9128778.42 * floors -
          3441.57 * totalSqFt +
          130.28 * perimeter) *
        factor;
      const openings =
        (-2639696.69 +
          1063161.29 * rooms +
          6013458.51 * floors -
          2268.71 * totalSqFt -
          77.24 * perimeter) *
        factor;

      const finishes =
        (-142325786.46 +
          54973377.11 * rooms +
          310981527.28 * floors -
          117772.21 * totalSqFt -
          7077.23 * perimeter) *
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
        (-8805189.32 +
          3483166.44 * rooms +
          19696593.39 * floors -
          7442.76 * totalSqFt -
          465.63 * perimeter) *
        factor;

      const earthWork =
        (1028874.91 -
          367643.88 * rooms -
          2085898.96 * floors +
          787.56 * totalSqFt +
          735.46 * perimeter) *
        factor;

      const exteriorImprovements =
        (956071.24 -
          338278.68 * rooms -
          1920916.21 * floors +
          724.56 * totalSqFt +
          880.54 * perimeter) *
        factor;

      const utilities =
        (974971.29 -
          344965.92 * rooms -
          1958889.75 * floors +
          738.88 * totalSqFt +
          897.94 * perimeter) *
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
        '03 Concrete': concrete,
        '04 Masonry': masonry,
        '05 Metal': metal,
        '06 Wood and Plastic': woodAndPlastic,
        '07 Thermal and Moisture Protection': thermalAndMoisture,
        '08 Openings': openings,
        '09 Finishes': finishes,
        '10 Specialites': specialites,
        '11 Equipment': equipment,
        '12 Furnishing': furnishing,
        '13 Special Construction': specialConstruction,
        '14 Conveying Equipment': conveyingEquipment,
        '21 Fire': fire,
        '22 Plumbing': plumbing,
        '23 HVAC': HVAC,
        '26 Electrical': electrical,
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
        '31 Earthwork': earthWork,
        '32 Exterior Improvements': exteriorImprovements,
        '33 Utilities': utilities,
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
          cost: Math.round(rooms / 8.33 + (rooms > 100 ? 6 : 5)),
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

      console.log(
        'city factor--->>>',
        factor,
        'total sq ft--->',
        totalSqFt,
        'double queen',
        doubleQueenQuantity,
        'king one',
        kingOneQuantity,
        'ada',
        adaQuantity,
        'king studio',
        kingStudioQuantity,
        'concrete',
        concrete,
        'rooms',
        rooms,
        'floors',
        floors,
        'perimeter',
        perimeter,
      );
      return {
        floors,
        kingOneQuantity,
        kingStudioQuantity,
        perimeter,
        doubleQueenQuantity,
        totalSqFt,
        adaQuantity,
        buildingFactors,
        siteWorkFactors,
        generalFactors,
        projectFactors,
      };
    },
  });
};

export default plugin;
