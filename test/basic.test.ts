import test from 'node:test';
import assert from 'node:assert';
import { SchemaType, DataFlowType } from '@tak-ps/etl';

// task.ts calls Task.init() at module scope which requires an ETL environment,
// so these must be set before the dynamic import below
process.env.ETL_API = process.env.ETL_API || 'http://localhost:5001';
process.env.ETL_LAYER = process.env.ETL_LAYER || '1';
process.env.ETL_TOKEN = process.env.ETL_TOKEN || 'etl.test-token';

const { default: Task } = await import('../task.js');

test('Task static config', () => {
    assert.equal(Task.name, 'etl-arcgis');
    assert.deepEqual(Task.flow, [DataFlowType.Incoming, DataFlowType.Outgoing]);
});

test('Incoming Input schema', async () => {
    const task = await Task.init();
    const schema = await task.schema(SchemaType.Input, DataFlowType.Incoming);

    assert.equal(schema.type, 'object');
    for (const key of [
        'ARCGIS_URL',
        'ARCGIS_QUERY',
        'ARCGIS_QUERY_STRATEGY',
        'ARCGIS_PARAMS',
        'ARCGIS_PORTAL',
        'ARCGIS_USERNAME',
        'ARCGIS_PASSWORD'
    ]) {
        assert.ok(schema.properties[key], `Env schema missing property: ${key}`);
    }

    assert.deepEqual(schema.properties.ARCGIS_QUERY_STRATEGY.enum, ['Query', 'QueryTopFeatures']);
    assert.equal(schema.properties.ARCGIS_QUERY_STRATEGY.default, 'Query');
});

// Incoming Output schema depends on fetchLayer() reaching a live CloudTAK API
// (to read layer.incoming) and, if configured, ESRIDump.schema() reaching a
// live ArcGIS server - not exercised here since both require live services.

test('Outgoing Input schema', async () => {
    const task = await Task.init();
    const schema = await task.schema(SchemaType.Input, DataFlowType.Outgoing);

    assert.equal(schema.type, 'object');
    for (const key of [
        'ARCGIS_PORTAL',
        'ARCGIS_USERNAME',
        'ARCGIS_PASSWORD',
        'ARCGIS_POINTS_URL',
        'ARCGIS_LINES_URL',
        'ARCGIS_POLYS_URL',
        'PRESERVE_HISTORY'
    ]) {
        assert.ok(schema.properties[key], `Env schema missing property: ${key}`);
    }

    assert.equal(schema.properties.PRESERVE_HISTORY.type, 'boolean');
    assert.equal(schema.properties.PRESERVE_HISTORY.default, false);
});

test('Outgoing Output schema', async () => {
    const task = await Task.init();
    const schema = await task.schema(SchemaType.Output, DataFlowType.Outgoing);

    assert.equal(schema.type, 'object');
    assert.deepEqual(schema.properties, {});
});
