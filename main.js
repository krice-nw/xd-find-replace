console.log("Plugin Swap Text loaded");

const sg = require("scenegraph");
const cmd = require("commands");


function duplicateGroup(group, selection) {
    selection.items = [];
    var itemsToGroup = [];
    var newGroup;
//    var newGroup = new sg.Group();
    // assign all group children to newGroup
    group.children.forEach(function(groupItem, i) {
        console.log("Group item: ");
        console.log(groupItem);
        var newNode;

        if (groupItem instanceof sg.Group) {
            duplicateGroup(groupItem, selection);
        } else if (groupItem instanceof sg.RepeatGrid) {
            handleRepeatGrid(groupItem, selection);
        } else {

            // crate a new node based on the group child
            if (groupItem instanceof sg.Rectangle) {
                newNode = new sg.Rectangle();
                newNode.width = groupItem.width;
                newNode.height = groupItem.height;
                newNode.cornerRadii = groupItem.cornerRadii;
            } else if (groupItem instanceof sg.Ellipse) {
                newNode = new sg.Ellipse();
                newNode.radiusX = groupItem.radiusX;
                newNode.radiusY = groupItem.radiusY;                
            } else if (groupItem instanceof sg.Text) {
                newNode = new sg.Text();
                newNode.text = groupItem.text;
                console.log(groupItem.styleRanges);
                newNode.styleRanges = groupItem.styleRanges;
                console.log(newNode.styleRanges);
                newNode.flipY = groupItem.flipY;
                newNode.textAlign = groupItem.textAlign;
                newNode.lineSpacing = groupItem.lineSpacing;
                // newNode.areaBox = groupItem.areaBox;
                // newNode.clippedByArea = groupItem.clippedByArea;
                
            } else {
                newNode = new sg.GraphicNode();
            }
            newNode.fill = groupItem.fill;
            newNode.fillEnabled = groupItem.fillEnabled;
            newNode.stroke = groupItem.stroke;
            newNode.strokeEnabled = groupItem.strokeEnabled;
            newNode.strokeWidth = groupItem.strokeWidth;
            newNode.strokePosition = groupItem.strokePosition;
            newNode.strokeEndCaps = groupItem.strokeEndCaps;
            newNode.strokeJoins = groupItem.strokeJoins;
            newNode.strokeMiterLimit = groupItem.strokeMiterLimit;
            newNode.strokeDashArray = groupItem.strokeDashArray;
            newNode.strokeDashOffset = groupItem.strokeDashOffset;
            newNode.shadow = groupItem.shadow;
            newNode.blur = groupItem.blur;
            //newNode.pathData = groupItem.pathData;


            newNode.resize(groupItem.width, groupItem.height);
            newNode.transform = groupItem.transform;

            // now do the text editing
            if (newNode instanceof sg.Text) {
                modifyText(newNode);
            }
            
            console.log("Display newNode: ");
            console.log(newNode);
        }

/*      // error trying to add the newNode to the newGroup - edit outside edit content ...
        // add the node to the group or, if the first item, use it to create the group
        if (i > 0) {
            newGroup.addChild(newNode);
            //selection.insertionParent.addChild(newNode, i);
        } else {
            // add the newNode to the artboard
            selection.insertionParent.addChild(newNode);

            selection.items = [newNode];
            console.log("Group: " + selection.items.length);
            cmd.group();
            newGroup = selection.items[0];
            console.log("Display newGroup: ");
            console.log(newGroup);
        }
*/


        // add the newNode to the artboard
        selection.insertionParent.addChild(newNode);        
        itemsToGroup.push(newNode);
        
    });

    selection.items = itemsToGroup;
    console.log("Group: " + selection.items.length);
    cmd.group();
    newGroup = selection.items[0];

    return newGroup;
}

function handleRepeatGrid(repeatGrid, selection) {
    var repeatGridGroups = [];
    // see if we can iterate through child groups
    repeatGrid.children.forEach(function(childNode, i) {
        console.log("Child " + i + " is a " + childNode.constructor.name);
        if (childNode instanceof sg.Group) {
            // what if I remove the group parent (disassociate from the repeatGrid), pass it to handleGroup, 
            // then add the new group (after removing its parent) to the repeaGrid at this index
/*
            childNode.removeFromParent(); // made a chnage putside the current edit context
            var newGroup = handleGroup(childNode, selection);
            // but it doesn;t work because I need to select the group to ungroup it ..
            // an that is selecting a node outside the current edit context
            newGroup.removeFromParent();
            repeatGrid.addChild(newGroup, i);
*/
            // this should be a recursive dunplicateGroup function that returns the new group
            console.log("Call into duplicateGroup with: ")
            console.log(childNode);
            var newGroup = duplicateGroup(childNode, selection);
            console.log("Returned from duplicateGroup: ")
            console.log(newGroup);
            repeatGridGroups.push(newGroup);
        }
    })

    selection.items = [repeatGrid];

    // now see if we can replace the children
//    repeatGrid.removeAllChildren(); // made change outside current edit context
    repeatGridGroups.forEach(function(group, i) {
        group.removeFromParent();
        // this next loop is to try and get around the issue of adding a group
        group.children.forEach(function(item) {
            item.removeFromParent();
            repeatGrid.addChild(item); // made change outside current edit context
        });
        //repeatGrid.addChild(group, i); // cannot add a nested container
    });   

    return repeatGrid;
}

function handleGroup(group, selection) {
    // iterate through children, if no groups, repeat grios or text 
    // simply return the group
    var problemChildren = group.children.filter(child => 
        child instanceof sg.Group || child instanceof sg.RepeatGrid || child instanceof sg.Text
    );
    
    console.log(problemChildren.length);
    if (problemChildren.length === 0) {
        console.log("No need to ungroup - return the group!");
        return group;
    }

    var groupName = group.name;

    selection.items = [group];
    cmd.ungroup();
    var groupItems = selection.items.filter(item =>
        !(item instanceof sg.Group) && !(item instanceof sg.RepeatGrid)
    );
    var textItems = groupItems.filter(item => item instanceof sg.Text);
    textItems.forEach(function(item) {modifyText(item);});
    var nestedGroups = selection.items.filter(item =>
        item instanceof sg.Group || item instanceof sg.RepeatGrid
    );

    nestedGroups.forEach(function(group) {
        groupItems.push(handleGroup(group, selection));
    });

    selection.items = groupItems;
    cmd.group();
    selection.items[0].name = groupName;
    // return the new group
    return selection.items[0];
}


function unGroupSelection(selection) {
    var groupNodes = [];
    var repeatGridNodes = [];
    var selectionNodes = [];
//    var groupElements = {};

    selection.items.forEach(function(item) {
        if (item instanceof sg.Group) {
            console.log("we found a group");
            groupNodes.push(item);
        } else if (item instanceof sg.RepeatGrid) {
            console.log("we found a repeat grid");
            repeatGridNodes.push(item);
            //groupNodes.push(item);
        } else {
            if (item instanceof sg.Text) {
                console.log("We found text!");
                modifyText(item);
            }
            selectionNodes.push(item);
        }
    });

    repeatGridNodes.forEach(function(repeatGrid) {
        selectionNodes.push(handleRepeatGrid(repeatGrid, selection));
    });

    groupNodes.forEach(function(group) {
        //group = handleGroup(group, selection);
        selectionNodes.push(handleGroup(group, selection));
/*
        console.log("Make the group the selection");
        selection.items = [group];
        console.log("Ungroup");
        cmd.ungroup();
    //    console.log("recursively call into unGroupSelection with the ungrouped selection")
    //    unGroupSelection(selection)

        var groupItems = selection.items;
        groupItems.forEach(function(item) {
            console.log("Have a group item");
            if (item instanceof sg.Text) {
                console.log("We found text!");
                modifyText(item);
            }
        });
        console.log("Regroup the group items");
        selection.items = groupItems;
        cmd.group();
        console.log("add the group element to the selectionNodes array");
        selectionNodes.push(selection.items[0]);
*/
    });

    console.log("Update the selection to reflect calling state");
    selection.items = selectionNodes;
//    return groupElements;
}

function modifyText(textNode) {
    if (textNode instanceof sg.Text) {
        textNode.fill = new sg.Color("red");
    }
}

function assignProperties(node, data) {
    console.log(data);
    console.log("this: " + this);
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            console.log("Property: " + key);
            console.log(node[key]);
            var method = data[key].method

            if(method) {
                node[key].apply(node, data[key].value);
            } else {
                if (key === "fill" || key === "stroke") {
                    node[key] = new sg.Color(data[key].value);
                } else {
                    node[key] = data[key].value;
                }
            }
            console.log(node[key]);
        }
    }
};

function testProperties(data, testNode, baseToNode = true) {
    console.log("In testProperties");
    if (baseToNode) {
        assignProperties(testNode, data.sceneNode);
        assignProperties(testNode, data.graphicNode);
        if(testNode instanceof sg.Rectangle) {
            assignProperties(testNode, data.rectangleNode);
        } else if (testNode instanceof sg.Ellipse) {
            assignProperties(testNode, data.ellipseNode);
        } else if (testNode instanceof sg.Line) {
            assignProperties(testNode, data.lineNode);
        } else if (testNode instanceof sg.Text) {
            assignProperties(testNode, data.textNode);
        }    
    } else {
        if(testNode instanceof sg.Rectangle) {
            assignProperties(testNode, data.rectangleNode);
        } else if (testNode instanceof sg.Ellipse) {
            assignProperties(testNode, data.ellipseNode);
        } else if (testNode instanceof sg.Line) {
            assignProperties(testNode, data.lineNode);
        } else if (testNode instanceof sg.Text) {
            assignProperties(testNode, data.textNode);
        }
        assignProperties(testNode, data.graphicNode);
        assignProperties(testNode, data.sceneNode);    
    }
};

function testAPIs(data, selection, canvas) {

    console.log("First example plugin executed");
    console.log(canvas);

    var nodeTypes = ["Rectangle","Ellipse","Line", "Text"];

    console.log("Initail Loop");
    nodeTypes.forEach(function(nodeType) {
        console.log("nodeType: " + nodeType);
        var testNode = new sg[nodeType]();
    //    testNode.log("Let's get started ...!");
        console.log(testNode);

        console.log("Call testProperties for new node");
        testProperties(data, testNode);
        canvas.children.at(0).addChild(testNode);
        console.log("Call testProperties after node added to artboard");
        testProperties(data, testNode);
        selection.items = [testNode];
        console.log("Call testProperties after node is selected");
        testProperties(data, testNode);
    });

    var artboard = new sg.Artboard();
    artboard.name = "Test Artboard";
    artboard.width = canvas.children.at(0).width;
    artboard.height = canvas.children.at(0).height;
    artboard.fill = canvas.children.at(0).fill;
    artboard.viewportHeight = canvas.children.at(0).viewportHeight;
    artboard.translation = {x:artboard.width, y:0};
    canvas.addChild(artboard);
    // test validation for hasCustomName
    var hasCustomName = artboard.hasCustomName;
    console.log("Artboard custom name: " + hasCustomName);
    if (artboard.hasCustomName ? console.log("Artboard has custom name") : console.log("Artboard has default name"));
    var hasDefaultName = artboard.hasDefaultName;
    console.log("Artboard default name: " + hasDefaultName);
    if (artboard.hasDefaultName ? console.log("Artboard has default name") : console.log("Artboard has custom name"));

    console.log("Loop after creating a new artboard: " + artboard.name);
    nodeTypes.forEach(function(nodeType) {
        var testNode = new sg[nodeType]();
        console.log(testNode);

        console.log("Call testProperties for new node");
        testProperties(data, testNode, false);
        artboard.addChild(testNode);
        console.log("Call testProperties after node added to artboard");
        testProperties(data, testNode, false);
        selection.items = [testNode];
        console.log("Call testProperties after node is selected");
        testProperties(data, testNode, false);

        console.log("Test specific APIs that look to have changed");
        console.log("localDrawBounds: " + selection.items[0].localDrawBounds);
        console.log(selection.items[0].localDrawBounds);
        console.log("path: " + selection.items[0].pathData);
    });
};



// call writeFile from somewhere in your plugin code
function apiTests(selection, canvas) {

    console.log("Swap Text plugin executed");
    console.log("edit context: ");
    console.log(selection.editContext);

    var objectsToGroup = unGroupSelection(selection);
    console.log(objectsToGroup);
/*
    var data = gData;
    testAPIs(data, selection, canvas);
*/
};

return {
    commands: {
        "pluginCommnad": apiTests
    }
};
