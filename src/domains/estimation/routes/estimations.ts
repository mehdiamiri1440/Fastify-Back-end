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
        'storyHeight',
        'primeter',
        'totalSqFt',
      ]),
    },
    async handler(req) {
      const {
        rooms,
        zipCode,
        kingStudioQuantity = 125,
        kingOneQuantity = 5,
        doubleQueenQuantity = 20,
        adaQuantity = 9,
        floors = 0,
        storyHeight = 10,
        primeter,
      } = req.body;

      let { totalSqFt } = req.body;

      let factor = (
        await Locations.findOne({
          where: {
            zipCode,
          },
        })
      )?.factor;

      if (!factor) factor = 100;

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

      const totalProjectCost =
        generalFactors.generalFactorsCost +
        siteWorkFactors.siteWorkCost +
        buildingFactors.buildingCost;

      if (!totalSqFt)
        totalSqFt =
          (kingStudioQuantity * 348 +
            kingOneQuantity * 539 +
            doubleQueenQuantity * 437 +
            adaQuantity * 575) *
          1.43;

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
