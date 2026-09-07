import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Category } from '../models/category.model';
import { Service } from '../models/service.model';
import { BusinessInfo } from '../models/business-info.model';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/vaultra';

/**
 * Category names to seed. At least 4 distinct categories representative of IT
 * consulting services (Requirement 12.1).
 */
const CATEGORY_NAMES = ['Cloud', 'Seguridad', 'Desarrollo', 'Infraestructura'] as const;

type CategoryName = (typeof CATEGORY_NAMES)[number];

interface ServiceSeed {
  name: string;
  category: CategoryName;
  description: string;
  images: string[];
  price?: number;
  availabilityStatus: 'active';
}

/**
 * At least 20 services distributed across the available categories. Each service
 * has a name, description, at least one image URL, a price where applicable and
 * an `active` status (Requirement 12.2).
 */
const SERVICE_SEEDS: ServiceSeed[] = [
  // Cloud
  {
    name: 'Migración a la Nube',
    category: 'Cloud',
    description:
      'Planificación y ejecución de la migración de cargas de trabajo on-premise hacia proveedores cloud como AWS, Azure o GCP, minimizando el downtime.',
    images: ['https://images.vaultra.example/services/cloud-migration.jpg'],
    price: 4500,
    availabilityStatus: 'active',
  },
  {
    name: 'Arquitectura Cloud-Native',
    category: 'Cloud',
    description:
      'Diseño de arquitecturas escalables basadas en contenedores, funciones serverless y servicios administrados para maximizar la elasticidad.',
    images: ['https://images.vaultra.example/services/cloud-native.jpg'],
    price: 5200,
    availabilityStatus: 'active',
  },
  {
    name: 'Optimización de Costos Cloud',
    category: 'Cloud',
    description:
      'Auditoría de recursos cloud y recomendaciones de rightsizing, reservas y automatización para reducir la factura mensual sin afectar el rendimiento.',
    images: ['https://images.vaultra.example/services/cloud-cost.jpg'],
    price: 3000,
    availabilityStatus: 'active',
  },
  {
    name: 'Gestión Multi-Cloud',
    category: 'Cloud',
    description:
      'Implementación de estrategias multi-cloud con gobierno centralizado, políticas de seguridad y observabilidad unificada entre proveedores.',
    images: ['https://images.vaultra.example/services/multi-cloud.jpg'],
    price: 6000,
    availabilityStatus: 'active',
  },
  {
    name: 'Backup y Disaster Recovery',
    category: 'Cloud',
    description:
      'Diseño de estrategias de respaldo y recuperación ante desastres con RPO/RTO definidos y pruebas periódicas de restauración.',
    images: ['https://images.vaultra.example/services/backup-dr.jpg'],
    price: 3800,
    availabilityStatus: 'active',
  },
  // Seguridad
  {
    name: 'Auditoría de Seguridad',
    category: 'Seguridad',
    description:
      'Evaluación integral de la postura de seguridad de la organización, identificando vulnerabilidades y priorizando remediaciones.',
    images: ['https://images.vaultra.example/services/security-audit.jpg'],
    price: 4000,
    availabilityStatus: 'active',
  },
  {
    name: 'Pentesting de Aplicaciones',
    category: 'Seguridad',
    description:
      'Pruebas de penetración controladas sobre aplicaciones web y APIs para detectar y explotar vulnerabilidades antes que un atacante real.',
    images: ['https://images.vaultra.example/services/pentesting.jpg'],
    price: 5500,
    availabilityStatus: 'active',
  },
  {
    name: 'Gestión de Identidades (IAM)',
    category: 'Seguridad',
    description:
      'Implementación de soluciones de gestión de identidades y accesos con MFA, SSO y principios de mínimo privilegio.',
    images: ['https://images.vaultra.example/services/iam.jpg'],
    price: 4700,
    availabilityStatus: 'active',
  },
  {
    name: 'Cumplimiento Normativo',
    category: 'Seguridad',
    description:
      'Acompañamiento para alcanzar el cumplimiento de estándares como ISO 27001, PCI-DSS y GDPR, con documentación y controles asociados.',
    images: ['https://images.vaultra.example/services/compliance.jpg'],
    price: 5000,
    availabilityStatus: 'active',
  },
  {
    name: 'Respuesta a Incidentes',
    category: 'Seguridad',
    description:
      'Servicio de respuesta ante incidentes de seguridad con contención, erradicación, análisis forense y lecciones aprendidas.',
    images: ['https://images.vaultra.example/services/incident-response.jpg'],
    price: 6500,
    availabilityStatus: 'active',
  },
  // Desarrollo
  {
    name: 'Desarrollo de APIs REST',
    category: 'Desarrollo',
    description:
      'Diseño e implementación de APIs REST seguras, documentadas y escalables siguiendo buenas prácticas y estándares de la industria.',
    images: ['https://images.vaultra.example/services/rest-api.jpg'],
    price: 4200,
    availabilityStatus: 'active',
  },
  {
    name: 'Aplicaciones Web a Medida',
    category: 'Desarrollo',
    description:
      'Construcción de aplicaciones web full-stack personalizadas según los requisitos del negocio, con foco en usabilidad y rendimiento.',
    images: ['https://images.vaultra.example/services/web-apps.jpg'],
    price: 7000,
    availabilityStatus: 'active',
  },
  {
    name: 'Modernización de Aplicaciones',
    category: 'Desarrollo',
    description:
      'Refactorización y modernización de aplicaciones legacy hacia arquitecturas mantenibles, reduciendo la deuda técnica.',
    images: ['https://images.vaultra.example/services/modernization.jpg'],
    price: 5800,
    availabilityStatus: 'active',
  },
  {
    name: 'Integración de Sistemas',
    category: 'Desarrollo',
    description:
      'Integración de sistemas heterogéneos mediante APIs, colas de mensajes y ETL para lograr un flujo de datos coherente.',
    images: ['https://images.vaultra.example/services/integration.jpg'],
    price: 4900,
    availabilityStatus: 'active',
  },
  {
    name: 'Consultoría de Calidad de Software',
    category: 'Desarrollo',
    description:
      'Implementación de prácticas de testing automatizado, revisión de código y métricas de calidad para elevar la confiabilidad del software.',
    images: ['https://images.vaultra.example/services/qa.jpg'],
    price: 3500,
    availabilityStatus: 'active',
  },
  // Infraestructura
  {
    name: 'Automatización con IaC',
    category: 'Infraestructura',
    description:
      'Provisión y gestión de infraestructura como código con Terraform y Ansible para entornos reproducibles y versionados.',
    images: ['https://images.vaultra.example/services/iac.jpg'],
    price: 4600,
    availabilityStatus: 'active',
  },
  {
    name: 'Implementación de CI/CD',
    category: 'Infraestructura',
    description:
      'Diseño de pipelines de integración y despliegue continuo que aceleran las entregas manteniendo la estabilidad de producción.',
    images: ['https://images.vaultra.example/services/cicd.jpg'],
    price: 4300,
    availabilityStatus: 'active',
  },
  {
    name: 'Orquestación con Kubernetes',
    category: 'Infraestructura',
    description:
      'Despliegue y operación de clústeres Kubernetes con autoescalado, gestión de secretos y observabilidad integrada.',
    images: ['https://images.vaultra.example/services/kubernetes.jpg'],
    price: 6200,
    availabilityStatus: 'active',
  },
  {
    name: 'Monitoreo y Observabilidad',
    category: 'Infraestructura',
    description:
      'Implementación de stacks de monitoreo con métricas, logs y trazas distribuidas para diagnosticar problemas de forma proactiva.',
    images: ['https://images.vaultra.example/services/observability.jpg'],
    price: 3900,
    availabilityStatus: 'active',
  },
  {
    name: 'Administración de Redes',
    category: 'Infraestructura',
    description:
      'Diseño, configuración y hardening de redes empresariales con segmentación, VPN y políticas de firewall.',
    images: ['https://images.vaultra.example/services/networking.jpg'],
    price: 4100,
    availabilityStatus: 'active',
  },
  {
    name: 'Gestión de Bases de Datos',
    category: 'Infraestructura',
    description:
      'Administración, tuning y alta disponibilidad de bases de datos relacionales y NoSQL para garantizar rendimiento y resiliencia.',
    images: ['https://images.vaultra.example/services/databases.jpg'],
    price: 4400,
    availabilityStatus: 'active',
  },
];

/**
 * Single BusinessInfo record for Vaultra Consulting with name, description and
 * contact data (Requirement 12.3).
 */
const BUSINESS_INFO_SEED = {
  name: 'Vaultra Consulting',
  description:
    'Vaultra Consulting es una consultora de tecnología especializada en soluciones cloud, seguridad de la información, desarrollo de software e infraestructura. Acompañamos a nuestros clientes en su transformación digital con equipos expertos y un enfoque orientado a resultados.',
  address: 'Av. Corrientes 1234, Piso 8, Ciudad Autónoma de Buenos Aires, Argentina',
  phone: '+541145678900',
  socialMedia: {
    linkedin: 'https://www.linkedin.com/company/vaultra-consulting',
    twitter: 'https://twitter.com/vaultra',
    instagram: 'https://www.instagram.com/vaultra.consulting',
  },
  businessHours: 'Lunes a Viernes de 9:00 a 18:00 (GMT-3)',
};

export interface SeedResult {
  categoriesInserted: number;
  servicesInserted: number;
  businessInfoInserted: number;
}

/**
 * Seeds the database idempotently. Assumes an active Mongoose connection.
 *
 * - Categories are inserted only if the categories collection is empty.
 * - Services are inserted only if the services collection is empty.
 * - BusinessInfo is inserted only if no BusinessInfo document exists.
 *
 * Running the seeder repeatedly does not create duplicates (Requirement 12.4).
 */
export async function seedDatabase(): Promise<SeedResult> {
  const result: SeedResult = {
    categoriesInserted: 0,
    servicesInserted: 0,
    businessInfoInserted: 0,
  };

  // --- Categories (12.1) ---
  const categoryCount = await Category.countDocuments();
  if (categoryCount === 0) {
    const created = await Category.insertMany(
      CATEGORY_NAMES.map((name) => ({ name }))
    );
    result.categoriesInserted = created.length;
    console.log(`[seed] Inserted ${created.length} categories.`);
  } else {
    console.log(`[seed] Categories already present (${categoryCount}). Skipping.`);
  }

  // Build a name -> ObjectId map from whatever categories exist so that services
  // reference real category ids (whether just inserted or pre-existing).
  const categories = await Category.find();
  const categoryIdByName = new Map<string, mongoose.Types.ObjectId>();
  for (const category of categories) {
    categoryIdByName.set(category.name, category._id as mongoose.Types.ObjectId);
  }

  // --- Services (12.2) ---
  const serviceCount = await Service.countDocuments();
  if (serviceCount === 0) {
    const serviceDocs = SERVICE_SEEDS.map((seed) => {
      const categoryId = categoryIdByName.get(seed.category);
      if (!categoryId) {
        throw new Error(
          `[seed] Cannot seed service "${seed.name}": category "${seed.category}" not found.`
        );
      }
      return {
        name: seed.name,
        category: categoryId,
        description: seed.description,
        images: seed.images,
        price: seed.price,
        availabilityStatus: seed.availabilityStatus,
      };
    });

    const created = await Service.insertMany(serviceDocs);
    result.servicesInserted = created.length;
    console.log(`[seed] Inserted ${created.length} services.`);
  } else {
    console.log(`[seed] Services already present (${serviceCount}). Skipping.`);
  }

  // --- BusinessInfo (12.3) ---
  const existingBusinessInfo = await BusinessInfo.findOne();
  if (!existingBusinessInfo) {
    await BusinessInfo.create(BUSINESS_INFO_SEED);
    result.businessInfoInserted = 1;
    console.log('[seed] Inserted BusinessInfo record.');
  } else {
    console.log('[seed] BusinessInfo already present. Skipping.');
  }

  return result;
}

/**
 * Standalone runner: connects to MongoDB, seeds the database and disconnects.
 * Executed via `npm run seed` (Requirement 12.5), independently of the server.
 */
async function run(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[seed] Connected to MongoDB.');

    const result = await seedDatabase();

    console.log('[seed] Done:', result);
  } catch (error) {
    console.error('[seed] Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('[seed] Disconnected from MongoDB.');
  }
}

// Only auto-run when executed directly (not when imported by tests).
if (require.main === module) {
  void run();
}
