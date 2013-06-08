var gTabs = null;

// This is a very basic format function, but it will serve our goals.
String.prototype.format = function() {
  var i = 0, s = this, re;
  while(i < arguments.length) {
    re = new RegExp("\\{" + i + "\\}", 'gm');
    s = s.replace(re, arguments[i++]);
  }
  return s;
};

var CHECKBOX_TEMPLATE = '<div> \
   <input onclick="handleCheckbox({0}, {1}, this);" \
          type="checkbox" \
          id="sensor_{1}_{0}"\
          checked="{3}"> \
       <label for="sensor_{1}_{0}">{2}</label> \
  </div>';


var handleCheckbox = function (sensorId, roomId, cb) {
  // if sensor was active, cb.value will be "on"
  // before the callback has finished.
  var active = ! (cb.value == "on");
  var request = {
    'sensor' : sensorId,
    'room': roomId,
    'state': active
  };
  console.log("Sending Arm request", request);
  gapi.client.monitoring.arm(request).execute(function(resp){
    if (!resp) {
      alert("Failed to change sensor state");
    } else {
      console.log(resp);
      console.log("reloading the data...");
      reloadAllData(true);
    }
  });
};

var toggleSensorState = function (sensorId, cb) {
  console.log("toggleSensorState: " + sensorId);
  var newState = !(!!currentState);
  console.log("New state: " + newState);
};

/**
 * It's ugly as a sin, but it works. It will produce something like this:
 *
 * <div>
 *  <input onclick="handleCheckbox(this, "DddEeeFff");"
 *         type="checkbox"
 *         id="sensor_0_DddEeeFff">
 *      <label for="sensor_0_DddEeeFff">DddEeeFff</label>
 * </div>
 */
var makeCheckBox = function (roomId, name, sensorId, checked) {
  return CHECKBOX_TEMPLATE.format(sensorId, roomId, name, checked);
}


/**
 * Builds an HTML for a room tab, consisting of checkboxes for sensors.
 *
 * @param room a JSON/JS object for Room returned by the API
 *
 * @returns {string} HTML for a newly created DIV for the tab.
 */
function makeRoomHtml(room) {
  var html = "";
  for (var item in room.sensors) {
    var sensor = room.sensors[item];
    var checked = sensor.active ? "checked" : ""

    html += makeCheckBox(
        room['id'],
        sensor.sensorName,
        sensor['id'],
        checked,
        item);
  }

  html += "<div class='room-buttons'>";
  html += "<button id='add-sensor' value='" + room['id'] + "'>Add sensor</button>"
  html += "&nbsp;";
  html += "<button>Disarm room</button>";
  html += "&nbsp;";
  html += "<button>Arm room</button>";
  html += "</div>";

  return html;
}

/**
 * Builds or re-builds tabs control from JSON-RPC response.
 *
 * @param resp JSON-RPC response payload
 * @param reload if <code>true</code> then tab bar will be reset to it's original state
 * and then rebuild; otherwise will just build the tab bar.
 */
var rebuildTabBar = function (resp, reload) {
  if (!resp  || !resp.items || resp.items.length == 0) {
    alert("No rooms created. Please add some!");
  } else {

    var selected = 0;
    if (gTabs != null) {
      selected = gTabs.tabs("option", "active");
    }

    if (reload) {
      $("div#tabs").tabs("destroy");
      $("div#tabs").html("<ul></ul>");
    }

    for (var item in resp.items) {
      var room = resp.items[item];
      var num_tabs = $("div#tabs ul li").length + 1;

      $("div#tabs").append(
          "<div id='tab" + num_tabs + "'>" + makeRoomHtml(room, item) + "</div>"
      );

      $("div#tabs ul").append(
          "<li><a href='#tab" + num_tabs + "'>" + room.name + "</a></li>"
      );
    }

    gTabs = $("div#tabs").tabs();
    gTabs.tabs("option", "active", selected);
  }
};

/**
 * [Re]loads all the data from the API and [re]build the tab bar.
 *
 * @param reload Re-load and re-build if true.
 */
var reloadAllData = function(reload) {
  gapi.client.monitoring.listRooms().execute(function (resp) {
    console.info("Data from API:", resp);

    if (! reload ) {
      $(document).ready(function() { rebuildTabBar(resp) });
    } else {
      rebuildTabBar(resp, true);
    }

    $('button#add-sensor').button().click(function (event) {
      addSensorDialog(event.currentTarget.value);
    })
  });
}

/**
 * Called by Google JS client upon finishing to load.
 */
function init() {
//  var ROOT = 'https://cloud-endpoints-example.appspot.com/_ah/api';
  var ROOT = 'http://localhost:8888/_ah/api';
  gapi.client.load('monitoring', 'v1', reloadAllData, ROOT);
}