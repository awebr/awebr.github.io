
export class Sensors {

    constructor( testmode ) {        

        var sensors = this;
        
        this.gpsLocationHistoryArray = [];

        this.testmode = testmode;

        if(this.testmode) {
            this.gpsTestData = []
            this.gpsTestDataIndex = 100;
            fetch("sensors/gps_simu_data.json")
            .then(response => { console.log("JSON read"); return response.json() } )
            .then(json => { sensors.gpsTestData = json; console.log("GPS Testdata loaded") } );  
            setInterval(this.onTestModeTimer.bind(this), 1000);
        } else {
        this.initGPS()      
       }
    }

    initGPS() {
        navigator.geolocation.watchPosition(
            this.onGPSUpdated.bind(this), 
            this.onGPSError.bind(this), 
            {
                enableHighAccuracy: true, 
                maximumAge        : 500, 
                timeout           : 10000
            });            
    }

    onTestModeTimer() {
        this.gpsTestDataIndex++
        this.gpsLocationHistoryArray.push(
            {
            barometric_altitude: -1,
            gps_altitude: this.gpsTestData[this.gpsTestDataIndex].gps_altitude,
            latitude: this.gpsTestData[this.gpsTestDataIndex].latitude,
            longitude: this.gpsTestData[this.gpsTestDataIndex].longitude,
            timestamp: Date.now(),
            heading: -1,
            speed:-1
            }
        )        
    }

    onGPSUpdated(loc) {
        console.log(loc)

        this.gpsLocationHistoryArray.push(
            {
            barometric_altitude: -1,
            gps_altitude: loc.coords.altitude,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            timestamp: loc.timestamp,
            heading: loc.heading,
            speed:loc.coords.speed
            }
        )
    }

    onGPSError(e) {
        console.log(e.code)
        alert(e.code)
    }

    getLocationHistory() {
        return this.gpsLocationHistoryArray
    }

    getCurrentLocation() {
        return this.gpsLocationHistoryArray[this.gpsLocationHistoryArray.length-1]
    }    
    // getLocation() {
    //     if( this.gpsLocationDataArray != null ) {
    //         return this.gpsLocationDataArray[this.gpsTestDataIndex++]
    //     }
    // }

    getHeading() {

    }

    getBearing () {
        if( this.gpsLocationHistoryArray.length > 2) {
            var start_latitude  = this.gpsLocationHistoryArray[this.gpsLocationHistoryArray.length-1].latitude
            var start_longitude = this.gpsLocationHistoryArray[this.gpsLocationHistoryArray.length-1].longitude
            var stop_latitude   = this.gpsLocationHistoryArray[this.gpsLocationHistoryArray.length-2].latitude
            var stop_longitude  = this.gpsLocationHistoryArray[this.gpsLocationHistoryArray.length-2].longitude
            
            var y = Math.sin(stop_longitude-start_longitude) * Math.cos(stop_latitude);
            var x = Math.cos(start_latitude)*Math.sin(stop_latitude) -
                    Math.sin(start_latitude)*Math.cos(stop_latitude)*Math.cos(stop_longitude-start_longitude);
            var brng = Math.atan2(y, x) * 180 / Math.PI;
                    
            //console.log("Bearing in degreee:  " + brng);        
            return brng + 180
        } else {
            return -1
        }
    }

    getSpeedOverGround() {
        return -1
    }
    // getSpeedOverGround() {
    //     var current_position = this.gpsLocationDataArray[this.gpsTestDataIndex]
    //     var previous_position = this.gpsLocationDataArray[this.gpsTestDataIndex-2]

    //     function calc_distance(lat1, lon1, lat2, lon2) {
    //         var p = 0.017453292519943295;    // Math.PI / 180
    //         var c = Math.cos;
    //         var a = 0.5 - c((lat2 - lat1) * p)/2 + 
    //                 c(lat1 * p) * c(lat2 * p) * 
    //                 (1 - c((lon2 - lon1) * p))/2;
          
    //         return 12742000 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    //       }
          

    //       var dinstance_in_meter = calc_distance(current_position.latitude, current_position.longitude, previous_position.latitude, previous_position.longitude )
    //       return Math.round(dinstance_in_meter * 3.6 / 2)
    // } 
        
}