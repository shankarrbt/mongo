
t = db.idhack
t.drop()


t.insert( { _id : { x : 1 } , z : 1 } )
t.insert( { _id : { x : 2 } , z : 2 } )
t.insert( { _id : { x : 3 } , z : 3 } )
t.insert( { _id : 1 , z : 4 } )
t.insert( { _id : 2 , z : 5 } )
t.insert( { _id : 3 , z : 6 } )

assert.eq( 2 , t.findOne( { _id : { x : 2 } } ).z , "A1" )
assert.eq( 2 , t.find( { _id : { $gte : 2 } } ).count() , "A2" )
assert.eq( 2 , t.find( { _id : { $gte : 2 } } ).itcount() , "A3" )

t.update( { _id : { x : 2 } } , { $set : { z : 7 } } )
assert.eq( 7 , t.findOne( { _id : { x : 2 } } ).z , "B1" )

t.update( { _id : { $gte : 2 } } , { $set : { z : 8 } } , false , true )
assert.eq( 4 , t.findOne( { _id : 1 } ).z , "C1" )
assert.eq( 8 , t.findOne( { _id : 2 } ).z , "C2" )
assert.eq( 8 , t.findOne( { _id : 3 } ).z , "C3" )

// explain output should show that the ID hack was applied.
var query = { _id : { x : 2 } };
var explain = t.find( query ).explain( true );
print( "explain for " + tojson( query , "" , true ) + " = " + tojson( explain ) );
assert.eq( 1 , explain.n , "D1" );
assert.eq( 1 , explain.nscanned , "D2" );
assert.neq( undefined , explain.cursor , "D3" );
assert.neq( "" , explain.cursor , "D4" );
assert.neq( undefined , explain.indexBounds , "D5" );
assert.neq( {} , explain.indexBounds , "D6" );

// ID hack cannot be used with hint().
var query = { _id : { x : 2 } };
var explain = t.find( query ).explain();
t.ensureIndex( { _id : 1 , a : 1 } );
var hintExplain = t.find( query ).hint( { _id : 1 , a : 1 } ).explain();
print( "explain for hinted query = " + tojson( hintExplain ) );
assert.neq( explain.cursor, hintExplain.cursor, "E1" );

// ID hack cannot be used with skip().
var skipExplain = t.find( query ).skip(1).explain();
print( "explain for skip query = " + tojson( skipExplain ) );
assert.neq( explain.cursor, skipExplain.cursor, "F1" );

// Only acceptable projection for ID hack is {_id: 1}.
var projectionExplain = t.find( query, { _id : 0, z : 1 } ).explain();
print( "explain for projection query = " + tojson( projectionExplain ) );
assert.neq( explain.cursor, projectionExplain.cursor, "G1" );

// Covered query returning _id field only can be handled by ID hack.
var coveredExplain = t.find( query, { _id : 1 } ).explain();
print( "explain for covered query = " + tojson( coveredExplain ) );
assert.eq( explain.cursor, coveredExplain.cursor, "H1" );
// Check doc from covered ID hack query.
assert.eq( { _id : { x: 2 } }, t.findOne( query, { _id : 1 } ), "H2" );
