console.log("Plugin Swap Text loaded");

const sg = require("scenegraph");
const cmd = require("commands");

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
    // return the new group
    return selection.items[0];
}


function unGroupSelection(selection) {
    var groupNodes = [];
    var selectionNodes = [];
//    var groupElements = {};

    selection.items.forEach(function(item) {
        if (item instanceof sg.Group) {
            console.log("we found a group");
            groupNodes.push(item);
        } else if (item instanceof sg.RepeatGrid) {
            console.log("we found a repeat grid");
            groupNodes.push(item);
        } else {
            if (item instanceof sg.Text) {
                console.log("We found text!");
                modifyText(item);
            }
            selectionNodes.push(item);
        }
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
