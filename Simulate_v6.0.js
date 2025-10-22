let rawEventData;
let rawForecastData;
let eventData;
let summaryData;
let forecastData;
let forecastArray;
let injectData;
let initialDataPoints = 50; // Adjust as needed
let isPlaying = false; // Define isPlaying here
let thresholdFAL =0;
let thresholdFW =0;
let thresholdSFW =0;
let timeStep = 3000;
let thldColorFAL = "#FFD700"; //gold
let thldColorFW = "#FF8C00"; //dark orange
let thldColorSFW = "#FF0000"; //red
let thldColorAdd1 = "#808080";
let thldColorAdd2 = "#008B8B";
let maxY1Mode = "Auto";
let maxY1;


//============================================
//NOTE
//============================================ 
	// Enabled the ability to change the FW thresholds - undisabled code and html text inputs
	// Version 6 _ Changed Forecast Look up (fn - checkForecast()) so forecast timesteps dont have to be an exact match, only <=. This means will work with RAW BlackBox Forecast outputs. (Forecast arrays need ot be Newest to Oldest). It also sorts teh json oldest ot newest which stops errors.


//============================================
//LOAD PAGE
//============================================ 

document.addEventListener("DOMContentLoaded", function() {
    //READ EXCEL
   var input = document.getElementById('excelEventDataInput');
   // Add event listener for file selection
   input.addEventListener('change', function(e) {
     var file = e.target.files[0];
     readExcel(file, 'eventData');
   });
   
   //READ EXCEL
   var input = document.getElementById('excelSummaryDataInput');
   // Add event listener for file selection
   input.addEventListener('change', function(e) {
     var file = e.target.files[0];
     readExcel(file, 'summaryData');
   });
   
   //READ EXCEL
   var input = document.getElementById('excelForecastDataInput');
   // Add event listener for file selection
   input.addEventListener('change', function(e) {
     var file = e.target.files[0];
     readExcel(file, 'forecastData');
   });
   
   //READ EXCEL
   var input = document.getElementById('excelInjectDataInput');
   // Add event listener for file selection
   input.addEventListener('change', function(e) {
     var file = e.target.files[0];
     readExcel(file, 'injectData');
   });

});


//============================================
//BTN LISTENERS
//============================================

//CHART CONTROLS
document.getElementById('btnPlay').addEventListener('click', playChart);
document.getElementById('btnSkipNext').addEventListener('click', skipNext);
document.getElementById('btnSkipBack').addEventListener('click', skipBack);
document.getElementById('btnReset').addEventListener('click', resetChart);

//ISSUING
document.getElementById('btnIssueFAL').addEventListener('click', issueFAL);
document.getElementById('btnIssueFW').addEventListener('click', issueFW);
document.getElementById('btnIssueSFW').addEventListener('click', issueSFW);

//THRESHOLDS VALUES
document.getElementById('thresholdFAL').addEventListener('change', setFALThreshold);
document.getElementById('thresholdFW').addEventListener('change', setFWThreshold);  // UNDisabled******************************
document.getElementById('thresholdSFW').addEventListener('change', setSFWThreshold);
document.getElementById('thresholdAddFirst').addEventListener('change', setThresholdAddFirst);
document.getElementById('thresholdAddSecond').addEventListener('change', setThresholdAddSecond);

//COLOURS
document.getElementById('colorThldFAl').addEventListener('change', setThldColorFAL);
document.getElementById('colorThldFW').addEventListener('change', setThldColorFW);  // Hidden until can resolve associate stats in 'summaryData'
document.getElementById('colorThldSFW').addEventListener('change', setThldColorSFW);  // Hidden until can resolve associate stats in 'summaryData'
document.getElementById('colorAddFirst').addEventListener('change', setColorAddFirst);
document.getElementById('colorAddSecond').addEventListener('change', setColorAddSecond);

//THRHSOLD NAMES
document.getElementById('txtThldNameFAL').addEventListener('change', setTxtThldNameFAL);
document.getElementById('txtThldNameFW').addEventListener('change', setTxtThldNameFW);  // UNDisabled******************************
document.getElementById('txtThldNameSFW').addEventListener('change', setTxtThldNameSFW);
document.getElementById('txtThldNameAddFirst').addEventListener('change', setTxtThldNameAddFirst);
document.getElementById('txtThldNameAddSecond').addEventListener('change', setTxtThldNameAddSecond);

//OPTIONS
document.getElementById('txtMaxY1').addEventListener('change', setMaxY1);
document.getElementById('txtTimeStep').addEventListener('change', setTimeStep);



//============================================
//READ Excel
//============================================

function readExcel(file, dataType) {
  // Create a file reader
  var reader = new FileReader();

  // Set up the file reader onload function
  reader.onload = function(e) {
      var dataArray = new Uint8Array(e.target.result);
      var workbook = XLSX.read(dataArray, { type: 'array' });
      // Get the first sheet name
      var sheetName = workbook.SheetNames[0];
      // Convert the sheet to JSON
      var result = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      // Use the jsonData as required
      //console.log(result);
      //Creates Deep Copies - that aren't linked to each other
	  
      if (dataType == 'eventData'){
            console.log("EVENT DATA");
            rawEventData = JSON.parse(JSON.stringify(result));
            eventData = JSON.parse(JSON.stringify(result));
            //Convert to time
            convertTimeToTimestamp(eventData, "time");    
            console.log(eventData);
            var importEventData = document.getElementById("importEventData");
            importEventData.classList.remove("bg-warning");
            importEventData.classList.add("bg-info");
            //Show the Event Controls row
            var eventDiv = document.getElementById("eventDiv");
            eventDiv.style.visibility = "visible";
			
	  }else if (dataType == 'summaryData'){
            console.log("SUMARY DATA");
            summaryData = JSON.parse(JSON.stringify(result));
            //Clear previous
            summaryData[0].IssueTime = "";
            summaryData[0].IssueLevel = "";
            //Format times
            convertTimeToTimestamp(summaryData, "PeakTime");
            convertTimeToTimestamp(summaryData, "TriggerCross"); 
            convertTimeToTimestamp(summaryData, "RemoveTime");
            console.log(summaryData);
            var importSummaryData = document.getElementById("importSummaryData");
            importSummaryData.classList.remove("bg-warning");
            importSummaryData.classList.add("bg-info");
            //Add New Rows
            createNewRow('Flood Alert', 0, 'FAL', thldColorFAL);
            createNewRow('Severe Flood Warning', 0, 'SFW', thldColorSFW);
            createNewRow('Additonal 1', 0, 'ADD1', thldColorAdd1);
            createNewRow('Additonal 2', 0, 'ADD2', thldColorAdd2);
            //Set FW color to start
            summaryData[0].ThresholdColor = thldColorFW;			
            //Show the summary Div row
            var summaryDiv = document.getElementById("summaryDiv");
            summaryDiv.style.visibility = "visible";
            summaryDiv.style.visibility
			      thresholdFW = summaryData[0].ThldValue;
            document.getElementById("nodeBadge").innerHTML ="<h4><span class='badge bg-secondary' style='width:100%'>" + summaryData[0].NodeName + ": " + summaryData[0].TAName + "</span></h4>";
            document.getElementById("thresholdBadge").innerHTML ="<h4><span class='badge bg-secondary' style='width:100%'>" + summaryData[0].ThldName + ": " + summaryData[0].ThldValue + " " +  summaryData[0].ThldUnit + "</span></h4>";
            //SET OPTIONS MODAL
            //Thldvalue
            document.getElementById("thresholdFW").value = thresholdFW;
            //Thldnames
            document.getElementById("txtThldNameFAL").value = summaryData[1].ThldName;
            document.getElementById("txtThldNameFW").value = summaryData[0].ThldName;
            document.getElementById("txtThldNameSFW").value = summaryData[2].ThldName;
            document.getElementById("txtThldNameAddFirst").value = summaryData[3].ThldName;
            document.getElementById("txtThldNameAddSecond").value = summaryData[4].ThldName;

		}else if (dataType == 'forecastData'){
            console.log("FORECAST DATA");
            rawForecastData = JSON.parse(JSON.stringify(result));
            // Filter out entries with non-date ForecastTime values (e.g., 'Observed' or 'Simulated')
            rawForecastData = rawForecastData.filter(item => !isNaN(new Date(item.ForecastTime)));
            // Sort the valid entries by ForecastTime (oldest to newest)
            rawForecastData.sort((a, b) => new Date(a.ForecastTime) - new Date(b.ForecastTime));
            // Debugging: Log the filtered and sorted data
            console.log("Filtered and Sorted Data:", rawForecastData);
            //Format times
            convertTimeToTimestamp(rawForecastData, "time");
            convertTimeToTimestamp(rawForecastData, "ForecastTime");
            console.log(rawForecastData);
            document.getElementById("importForecastData").classList.remove("bg-light");
            document.getElementById("importForecastData").classList.add("bg-info");
            forecastArray = getForecastList(rawForecastData);
            // Sort the unique values from newest to oldest
            forecastArray.sort((a, b) => new Date(a) - new Date(b));
            // Debugging: Print the sorted unique values
            console.log("Forecast List (Sorted Newest to Oldest):", forecastArray);
            // Print the unique ForecastTime values
            console.log("Forecast List---------");
            console.log(forecastArray);
            let firstForecast = forecastArray[0];
            console.log("First Forecast---------");
            console.log(firstForecast);
            filterForecast(firstForecast);
            renderChart(eventData,initialDataPoints);
            renderTable(eventData,initialDataPoints);
        }else if (dataType == 'injectData'){
            console.log("INJECT DATA");
            injectData = JSON.parse(JSON.stringify(result));
            //Format times
            convertTimeToTimestamp(injectData, "time");
            convertTimeToTimestamp(injectData, "ForecastTime");
            console.log(injectData);
            document.getElementById("importInjectData").classList.remove("bg-light");
            document.getElementById("importInjectData").classList.add("bg-info");
        }

	    if(summaryData && eventData){
          console.log("ALL DATA LOADED");
          document.getElementById("banner").classList.remove("bg-warning");
          document.getElementById("banner").classList.add("bg-info");
          let formattedDate = displayDate(eventData[initialDataPoints -1].time);
          document.getElementById('statusBadge').innerHTML = "<h4><span class='badge bg-warning' style='width:100%;'>Data loaded. Current time: " + formattedDate + "</span></h4>";
          //document.getElementById('statusBadge').innerHTML = "<h4><span class='badge bg-warning' style='width:100%;'>Data loaded. Current time: " + eventData[initialDataPoints -1].time + "</span></h4>";
          //document.getElementById('btnModalLoad').style.visibility = "hidden";
          document.getElementById('btnModalLoad').classList.remove("btn-danger");
          document.getElementById('btnModalLoad').classList.add("btn-outline-info");
          document.getElementById('btnOptions').classList.remove("btn-warning");
          document.getElementById('btnOptions').classList.add("btn-info");
          renderChart(eventData,initialDataPoints);
          renderTable(eventData,initialDataPoints);
		}
  };

  // Read the file as an array buffer
  reader.readAsArrayBuffer(file);
}


//============================================
//CONVERT TIME
//============================================
	
	// Function to convert numeric 'time' to timestamp with milliseconds set to 0
	function convertTimeToTimestamp(inputData, myField) {
	  for (const item of inputData) {
		const numericTime = item[myField];
		const timestamp = (numericTime - 25569) * 86400 * 1000; // Convert Excel numeric date to JavaScript timestamp
		const date = new Date(timestamp);
		date.setMilliseconds(0); // Set milliseconds to 0
		item[myField] = date;
	  }
	}

	
	// Function to display the date in a certian way
	function displayDate(inputDate){
		const date = new Date(inputDate);
		const seconds = date.getSeconds();
		// Round the minutes to the nearest minute based on the nearest second
        if (seconds >= 30) {
          date.setMinutes(date.getMinutes() + 1);
        }
        date.setSeconds(0); // Reset seconds to zero
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit', // Use '2-digit' to display minutes as two digits
            //second: 'numeric',
            hour12: false,
        };
		const formattedDate = date.toLocaleString('en-US', options);
		return formattedDate;
	}
	
//============================================
//UNIQUE FORECAST LIST
//============================================

function getForecastList(data) {
        // Create an empty object to store unique ForecastTime values as keys
        const uniqueForecastTimes = {};
      
        // Iterate through the data array
            data.forEach(item => {
              // Extract the ForecastTime value from each item
              const forecastTime = item.ForecastTime;
              // Use the ForecastTime value as a key in the object
              // This will automatically eliminate duplicates
              uniqueForecastTimes[forecastTime] = true;
            });
        // Extract the keys (unique ForecastTime values) from the object and convert them to an array
        const uniqueForecastTimeArray = Object.keys(uniqueForecastTimes);
        return uniqueForecastTimeArray;
  }


//============================================
//CHECK FORECAST 
//============================================

function checkForecast(initialDataPoints) {
  const checkTime = eventData[initialDataPoints - 1].time; // Get the time to check
  const checkTimestamp = new Date(checkTime).getTime(); // Convert the checkTime to a UNIX TIMESTAMP

  const length = forecastArray.length;

  // Iterate through the forecastArray
    for (let i = 0; i < length; i++) {
      const currentTime = forecastArray[i];
      const nextTime = i < length - 1 ? forecastArray[i + 1] : null;
      const arrayTime = new Date(currentTime).getTime();

      // Find the closest time that is greater than or equal to checkTimestamp
            if (arrayTime >= checkTimestamp) {
              console.log("Matched");
              filterForecast(currentTime);

              // Select the toast element by its ID
              const myToast = document.getElementById('forecastToast');

              // Update the toast content
              const formattedCurrentDate = displayDate(currentTime);
              const formattedNextDate = nextTime ? displayDate(nextTime) : "N/A";
              myToast.querySelector('.toast-header strong').textContent = "Forecast Loaded";
              myToast.querySelector('.toast-body').innerHTML =
                "<p><strong>Current Forecast:</strong> " +
                formattedCurrentDate +
                "</p><p><strong>Next Forecast:</strong> " +
                formattedNextDate +
                "</p>";

              // Create a new Bootstrap Toast instance
              const toast = new bootstrap.Toast(myToast);

              // Show the toast
              toast.show();

              return true; // Found a matching or next forecast
            }
    }

  console.log("THERE IS NOT A MATCH");
  return false; // Input time does not exist in the array or is later than all times
}

	
//============================================
//CHECK INJECT 
//============================================

function checkInject(initialDataPoints) {
  checkTime = eventData[initialDataPoints -1 ].time;
  const checkTimestamp = new Date(checkTime).getTime();

  for (const item of injectData) {
    let myTime = item.time;
    myTime = new Date(myTime).getTime();

    if (myTime === checkTimestamp) {
      myInject = item.Inject;
	  //alert(myInject);

      // Select the toast element by its ID
      var myToast = document.getElementById('injectToast');
      // Update the toast content
      myToast.querySelector('.toast-header strong').textContent = "New Information";
	  let formattedDate = displayDate(item.time);
      myToast.querySelector('.toast-body').innerHTML = "<p><strong>Time of Information: </strong>" + formattedDate + "</p><p><strong> Information: </strong>" + myInject + "</p>";
      // Create a new Bootstrap Toast instance
      var toast = new bootstrap.Toast(myToast);
      // Show the toast
      toast.show();
      break;
    }
  }
}

	
//============================================
//FILTER FORECAST 
//============================================

//Filter function
function filterForecast(myForecastTime) {
	
    //forecastData = rawForecastData.filter(item => item.ForecastTime === myForecastTime);   
	forecastData = rawForecastData.filter(item => {
		const itemTimestamp = new Date(item.ForecastTime);
		const myTimestamp = new Date(myForecastTime);
		// Compare year, month, day, hour, and minute
		return (
			itemTimestamp.getUTCFullYear() === myTimestamp.getUTCFullYear() &&
			itemTimestamp.getUTCMonth() === myTimestamp.getUTCMonth() &&
			itemTimestamp.getUTCDate() === myTimestamp.getUTCDate() &&
			itemTimestamp.getUTCHours() === myTimestamp.getUTCHours() &&
			itemTimestamp.getUTCMinutes() === myTimestamp.getUTCMinutes()
		);
	});
    console.log("Forecast Filtered -----------------");
    console.log(forecastData);
}

//============================================
//CREATE EXTRA SUMMARY DATA ROWS
//============================================

function createNewRow(newThldType, newThldValue, newThldName, newThldColor) {
  // Check if the data array is not empty
  if (summaryData.length > 0) {
    // Create a copy of the first object in the array
    const newObject = { ...summaryData[0] };

    // Set the specified fields to empty values
    newObject.IssueTime = "";
    newObject.RemoveTime = "";
    newObject.UpdateCount = "";
    newObject.ThldValue = newThldValue;
    newObject.ThldType1 = newThldType;
    newObject.ThldType2 = "";
    newObject.ThldName = newThldName;
    newObject.IssueLevel = "";
    newObject.TriggerStatus = "";
    newObject.TriggerCross = "";
    newObject.PeakLevel = "";
    newObject.PeakTime = "";
    newObject.LeadTime = "";
	newObject.ThresholdColor = newThldColor;

    // Push the modified object to the summaryData array
    summaryData.push(newObject);
  }
}
//============================================
// CHART CONTROLS
//============================================

function resetChart(){
    console.log("Reset");
    initialDataPoints = 50;
	if (forecastData){checkForecast(initialDataPoints);}
	if (injectData){checkInject(initialDataPoints);}
    renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
	let formattedDate = displayDate(eventData[initialDataPoints -1].time);
	document.getElementById('statusBadge').innerHTML = "<h4><span class='badge bg-secondary' style='width:100%;'>Restarted. Current time: " + formattedDate + "</span></h4>";
}


function skipNext(){
    initialDataPoints = initialDataPoints + 1;
	if (forecastData){checkForecast(initialDataPoints);}
	if (injectData){checkInject(initialDataPoints);}
    renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
	let formattedDate = displayDate(eventData[initialDataPoints -1].time);
    document.getElementById('statusBadge').innerHTML = "<h4><span class='badge bg-secondary' style='width:100%;'>Skipped Forward. Current time: " + formattedDate + "</span></h4>";
}


function skipBack(){
    initialDataPoints =initialDataPoints -1;
	if (forecastData){checkForecast(initialDataPoints);}
	if (injectData){checkInject(initialDataPoints);}
    renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
	let formattedDate = displayDate(eventData[initialDataPoints -1].time);
	document.getElementById('statusBadge').innerHTML = "<h4><span class='badge bg-secondary' style='width:100%;'>Skipped Back. Current time: " + formattedDate + "</span></h4>"
}
  

// Restarts the chart animation from the current point
function updateChart() {
	if (forecastData){checkForecast(initialDataPoints);}
	if (injectData){checkInject(initialDataPoints);}
    renderChart(eventData, initialDataPoints);
	renderTable(eventData,initialDataPoints);
	let formattedDate = displayDate(eventData[initialDataPoints -1].time);
	document.getElementById('statusBadge').innerHTML = "<h4><span class='badge bg-info' style='width:100%;'>Playing. Current time: " + formattedDate + "</span></h4>";
}

// Handles the chart animation loop
async function playChart() {
    document.getElementById('btnPlay').innerHTML= "<i class='fas fa-pause'></i>";
	
    // Check if animation is already running
    if (isPlaying) {
        // If running, stop the animation
        stopChartAnimation();
        return;
    }
    isPlaying = true;
	
    // Continue the animation until the end of the data
    while (initialDataPoints < eventData.length) {
        initialDataPoints = initialDataPoints +1;
        updateChart();
        // Wait for 3 seconds before the next update (adjust the delay as needed)
        await sleep(timeStep);
        // Check if the animation was stopped by the user
        if (!isPlaying) {
        break;
        }
    }
    // Animation finished, reset the state
    isPlaying = false;
}

// Helper function to pause the animation
function stopChartAnimation() {
    isPlaying = false;
	document.getElementById('btnPlay').innerHTML= "<i class='fas fa-play'></i>";
	let formattedDate = displayDate(eventData[initialDataPoints -1].time);
	document.getElementById('statusBadge').innerHTML = "<h4><span class='badge bg-warning' style='width:100%;'>Paused. Current time: " + formattedDate + "</span></h4>";
}

// Helper function to simulate sleep/delay
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


//============================================
// THRESHOLDS
//============================================
function setFALThreshold(){
	thresholdFAL = document.getElementById("thresholdFAL").value;
	console.log(thresholdFAL);
	summaryData[1].ThldValue = thresholdFAL;
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}

// UNDisabled******************************
function setFWThreshold(){
	thresholdFW = document.getElementById("thresholdFW").value;
	console.log(thresholdFW);
	summaryData[0].ThldValue = thresholdFW;
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}


function setSFWThreshold(){
	thresholdSFW = document.getElementById("thresholdSFW").value;
	console.log(thresholdSFW);
	summaryData[2].ThldValue = thresholdSFW;
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}

function setThresholdAddFirst(){
	let addFirstValue = document.getElementById("thresholdAddFirst").value;
	console.log(addFirstValue);
	summaryData[3].ThldValue = addFirstValue;
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}

function setThresholdAddSecond(){
	let addSecondValue = document.getElementById("thresholdAddSecond").value;
	console.log(addSecondValue);
	summaryData[4].ThldValue = addSecondValue;
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}


//============================================
// THRESHOLD COLOURS
//============================================

function setThldColorFAL(){
	console.log("RESET FAL THRESHOLD COLOR");
	thldColorFAL = document.getElementById("colorThldFAl").value;
	summaryData[1].ThresholdColor = thldColorFAL;
	console.log(thldColorFAL);
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}

function setThldColorFW(){
	console.log("RESET FW THRESHOLD COLOR");
	thldColorFW = document.getElementById("colorThldFW").value;
	summaryData[0].ThresholdColor = thldColorFW;
	console.log(thldColorFW);
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}

function setThldColorSFW(){
	console.log("RESET SFW THRESHOLD COLOR");
	thldColorSFW = document.getElementById("colorThldSFW").value;
	summaryData[2].ThresholdColor = thldColorSFW;
	console.log(thldColorSFW);
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}

function setColorAddFirst(){
	console.log("RESET ADDITIONAL 1 COLOR");
	let addFirstColor = document.getElementById("colorAddFirst").value;
	summaryData[3].ThresholdColor = addFirstColor;
	console.log(addFirstColor);
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}

function setColorAddSecond(){
	console.log("RESET ADDITIONAL 2 COLOR");
	let addSecondColor = document.getElementById("colorAddSecond").value;
	summaryData[4].ThresholdColor = addSecondColor;
	console.log(thldColorSFW);
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}

//============================================
// THRESHOLD Name
//============================================

function setTxtThldNameFAL(){
	console.log("RESET FAL THRESHOLD NAME");
	let ThldName = document.getElementById("txtThldNameFAL").value;
	summaryData[1].ThldName = ThldName;
	console.log(ThldName);
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}

// UNDisabled******************************disabled
function setTxtThldNameFW(){
	console.log("RESET FW THRESHOLD NAME");
	let ThldName = document.getElementById("txtThldNameFW").value;
	summaryData[0].ThldName = ThldName;
	console.log(ThldName);
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}

function setTxtThldNameSFW(){
	console.log("RESET SFW THRESHOLD NAME");
	let ThldName = document.getElementById("txtThldNameSFW").value;
	summaryData[2].ThldName = ThldName;
	console.log(ThldName);
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}

function setTxtThldNameAddFirst(){
	console.log("RESET ADD 1 THRESHOLD NAME");
	let ThldName = document.getElementById("txtThldNameAddFirst").value;
	summaryData[3].ThldName = ThldName;
	console.log(ThldName);
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}

function setTxtThldNameAddSecond(){
	console.log("RESET ADD 2 THRESHOLD NAME");
	let ThldName = document.getElementById("txtThldNameAddSecond").value;
	summaryData[4].ThldName = ThldName;
	console.log(ThldName);
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}

//============================================
//OPTIONS UPDATING
//============================================

//TIMESTEP
function setTimeStep(){
	console.log("RESET TIMESTEP");
	timeStep = document.getElementById("txtTimeStep").value * 1000;
	console.log(timeStep);
	renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}

//Y1
function setMaxY1(){
	console.log("RESET Y1 MAX");
	maxY1Mode = "Manual";
	maxY1 = document.getElementById("txtMaxY1").value;
	console.log(maxY1);
    renderChart(eventData, initialDataPoints);
	renderTable(eventData, initialDataPoints);
}


//=====================================================================
//Issue
//=====================================================================
function issueFAL(){
	summaryData[1].ScenarioMessage = document.getElementById('txtFAL').value;
	summaryData[1].SceanrioIssueTime = eventData[initialDataPoints -1].time;
    summaryData[1].SceanrioIssueLevel = '';
	summaryData[1].SceanrioLeadTime = '';
	document.getElementById("statusFAL").innerHTML ="<h4><span class='badge bg-warning' style='width:100%' data-bs-toggle='modal' data-bs-target='#myIssueFALModal'><i class='fas fa-exclamation-triangle'></i> FAL</span></h4>";
	//document.getElementById("btnIssueFAL").disabled = true;
	//document.getElementById("btnIssueFAL").textContent = "Flood Alert in Force";
	document.getElementById("btnIssueFAL").style.visibility = "hidden";
	alert("Issued");

}
function issueFW(){
	//Do we want to keep -1 or not...could acount for delay ot get out.
	summaryData[0].ScenarioMessage = document.getElementById('txtFW').value;
	summaryData[0].SceanrioIssueTime = eventData[initialDataPoints -1].time;
	summaryData[0].SceanrioIssueLevel = eventData[initialDataPoints -1].value;
	summaryData[0].SceanrioLeadTime = summaryData[0].TriggerCross - summaryData[0].IssueTime
    document.getElementById("statusFW").innerHTML ="<h4><span class='badge bg-fworange' style='width:100%' data-bs-toggle='modal' data-bs-target='#myIssueFWModal'><i class='fas fa-exclamation-triangle'></i> FW</span></h4>";
	//document.getElementById("btnIssueFW").disabled = true;
	//document.getElementById("btnIssueFW").textContent = "Flood Warning in Force";
	document.getElementById("btnIssueFW").style.visibility = "hidden";
	alert("Issued");
}

function issueSFW(){
	summaryData[2].ScenarioMessage = document.getElementById('txtSFW').value;
	summaryData[2].SceanrioIssueTime = eventData[initialDataPoints -1].time;
	summaryData[2].SceanrioIssueLevel = '';
	summaryData[2].SceanrioLeadTime = '';
    document.getElementById("statusSFW").innerHTML ="<h4><span class='badge bg-danger' style='width:100%' data-bs-toggle='modal' data-bs-target='#myIssueSFWModal'><i class='fas fa-exclamation-triangle'></i> SFW</span></h4>";
	//document.getElementById("btnIssueSFW").disabled = true;
	//document.getElementById("btnIssueSFW").textContent = "Severe Flood Warning in Force";
	document.getElementById("btnIssueSFW").style.visibility = "hidden";
	alert("Issued");
}

//============================================
//RENDER CHART FUNCTION
//============================================

function renderChart(inputData, initialDataPoints) {
    // Extract x, y1, and y2 values from the data
    const xValues = inputData.map(item => item.time);
    const y1Values = inputData.slice(0, initialDataPoints).map(item => item.value);
    const y2Values = inputData.slice(0, initialDataPoints).map(item => item.WeightedAverage);
	let plotTitle = "Data Plot";

	if (summaryData){
		plotTitle = summaryData[0].NodeName;
	}
	

    // Create a trace for the first y-axis (value) as a scatter plot
    const trace1 = {
    x: xValues,
    y: y1Values,
    name: 'Value',
    type: 'scatter',
    mode: 'lines',
    yaxis: 'y1',
    line: {
    color: 'darkseagreen',
    width: 3
    }
    };

    // Create a trace for the second y-axis (WeightedAverage) as a bar chart
    const trace2 = {
    x: xValues,
    y: y2Values,
    name: 'Weighted Average',
    type: 'bar',
    yaxis: 'y2',
    marker: {
    color: 'lightseagreen',
    opacity: 0.5
    }
    };

    let trace3;
    let trace4;


    if (forecastData){
        // Create a trace for the second y-axis (WeightedAverage) as a bar chart
        const xForecast = forecastData.map(item => item.time);
        const yForecastRiver = forecastData.map(item => item.River);
        const yForecastRain = forecastData.map(item => item.Rain);
		
        trace3 = {
            x: xForecast,
            y: yForecastRiver,
            name: 'Forecast Level',
            type: 'scatter',
            mode: 'lines',
            yaxis: 'y1',
            line: {
                color: 'lightgreen',  // Set the color of the line
                width: 2,      // Set the width of the line
                dash: 'dot'   // Make the line dot (you can change this) //dash //dot //dashdot
            }
        };

        trace4 = {
            x: xForecast,
            y: yForecastRain,
            name: 'Forecast Rain',
            type: 'bar',
            yaxis: 'y2',
            marker: {
            color: 'lightblue',
            opacity: 0.5
            }
        };
    }

	
	// Calculate the x-axis range to cover the full 'time' series
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    // Calculate the minimum and maximum values for y1 and y2
    const minY1 = 0;
    const minY2 = 0;
	//MaxY1 Gloabl Variable with Mode - Auto or Manual
	if (maxY1Mode == "Auto"){
      maxY1 = Math.max(...inputData.map(item => item.value)) *1.5; //globalVariable
	}
	//document.getElementById("txtMaxY1").value = Math.round(maxY1); //the .toFixed(2) is 2 d.p.
	const maxY2 = Math.max(...inputData.map(item => item.WeightedAverage)) * 2;

	// Filter the JSON data for objects where ThldValue > 0
	const filteredData = summaryData.filter(item => item.ThldValue > 0);

	// Initialize an array to store the traces for horizontal lines
	const horizontalLines = [];

	// Loop through the filtered data and create a trace for each object
	filteredData.forEach(item => {
	  const lineTrace = {
		type: 'scatter',
		mode: 'lines',
		x: [xMin, xMax],
		y: [item.ThldValue, item.ThldValue], // Set the y-values to the ThldValue
		line: { color: `${item.ThresholdColor}`, width: 2, dash: 'dot' }, // Customize the line style
		name: `${item.ThldName}` // Customize the trace name
	  };

	  horizontalLines.push(lineTrace);
	});
	
    // Create layout for the plot
    const layout = {
		title: plotTitle,
		xaxis: {
		title: 'Time',
		range: [xMin, xMax], // Set x-axis range to cover the full 'time' series
		showgrid: true // Add grid lines to the x-axis
		},	
		yaxis: {
		title: 'River Level (m)',
		side: 'left',
		range: [minY1, maxY1], // Set y1-axis range to cover the entire series
		showgrid: true // Add grid lines to the y-axis
		},
		yaxis2: {
		title: 'Rainfall (mm)',
		side: 'right',
		overlaying: 'y',
		range: [minY2, maxY2] // Set y2-axis range to cover the entire series
		},
		legend: {
        x: 1.075, // If to right of plot - You can adjust this value to move the legend further to the right - move away from secondary axis lable
        //xanchor: 'right', // if on plot on plot
		y: 1.0 // You can adjust this value to change the vertical position of the legend
		}
		//margin: {
        //t: 50, // Reduce the top margin as needed (default is usually around 80)
        //l: 50,
        //r: 50,
        //b: 50
		//},
		// Adjust the plot height
		//height: 500 // Set the height in pixels, adjust as needed
    };
	
    // Combine traces and layout, and create the plot
    let dataToPlot = [trace1, trace2];
    if (forecastData){ dataToPlot = [trace3, trace4, trace1, trace2];}
	// Combine the traces for your data and the horizontal lines
	const finalDataToPlot = [...dataToPlot, ...horizontalLines];

	// Create the Plotly graph
	//Plotly.newPlot('plot', dataToPlot, layout);
	Plotly.newPlot('plot', finalDataToPlot, layout);
	
}

//============================================
//RENDER TABLE
//============================================

var tableBody = document.getElementById("phrasesTableBody");

function renderTable(inputData,initialDataPoints) {
			
		//console.log(initialDataPoints);
	    
		  // Clear the table body (remove all rows)
		 tableBody.innerHTML = '';
		
		for (let i = initialDataPoints - 1; i > initialDataPoints - 7; i--) {
			//console.log(i);
	        var myTable = inputData[i];
            var row = tableBody.insertRow();
            var checkboxCell = row.insertCell();
            var timeCell = row.insertCell();
            var riverValueCell = row.insertCell();
            var rainValueCell = row.insertCell();


                        //============================================
                        //ADD CUMULATIVE RAIN?
                        //============================================
    
            checkboxCell.innerHTML = '<input type="checkbox" class="form-check-input">';
            timeCell.textContent = myTable.time;
            riverValueCell.textContent = myTable.value;
            rainValueCell.textContent = myTable.WeightedAverage.toFixed(2);
		}
		
		
}

//============================================
//EXPORT JSON
//============================================
function downloadEventJSON() {
    if(eventData){
        var dataStr = JSON.stringify(eventData);
        var dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        var exportFileDefaultName = 'eventData.json';

        var linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click(); 
    }else{
        alert('Load the data first');
    }
}

function downloadSummaryJSON() {

    if(summaryData){
        var dataStr = JSON.stringify(summaryData);
        var dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        var exportFileDefaultName = 'summaryData.json';

        var linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click(); 
    }else{
        alert('Load the data first');
    }

}


