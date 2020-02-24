import { Sensors } from './sensors/sensors.js'

class GaugeLiftmate extends HTMLElement {

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.innerHTML = `
          <style media="screen">
            :host {
              display: block;
            }
          </style>
          <canvas></canvas>
        `;

    this.sensors = new Sensors( true )
    this.track = []
    this.bearing = 0
    this.current_gauge_bearing = 0
  }

  connectedCallback() {
    this.canvas = this.shadow.querySelector('canvas')
    this.context = this.canvas.getContext('2d')
    this.canvas.width = this.clientWidth
    this.canvas.height = this.clientHeight
    this.canvas.radius = Math.min(this.clientWidth, this.clientHeight) * 0.48
    this.context.translate(this.canvas.width / 2, this.canvas.height / 2)

    setInterval(this.onTimer.bind(this), 200);
  }

  onTimer() {
    this.draw();
  }

  draw() {
    this.track = this.sensors.getLocationHistory()
    this.bearing = this.sensors.getBearing()

    var current_location = this.track[this.track.length - 1]

    this.context.clearRect(-this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);
    this.context.rotate(0);
    this.draw_background();

    var track_data_available = this.track.length > 0
    var track_has_more_than_10_sec_of_data = this.track.length > 10

    if (track_data_available) {
      //>> draw altitude
      this.context.fillStyle = "#0000FF80";
      this.context.font = "20px Arial";
      this.context.fillText(`${current_location.gps_altitude} m`, -this.canvas.width / 2, -this.canvas.height / 2 + 20);
      //<<

      //>> draw speed over ground
      this.context.fillStyle = "#80008080";
      this.context.font = "20px Arial";
      this.context.fillText(`${this.sensors.getSpeedOverGround()} km/h`, -this.canvas.width / 2, -this.canvas.height / 2 + 40);
      //<<

      //>> draw bearing
      this.context.fillStyle = "#80008080";
      this.context.font = "20px Arial";
      this.context.fillText(`${Math.round(Math.abs(this.bearing))}°`, -this.canvas.width / 2, -this.canvas.height / 2 + 60);
      //<<

      //>> draw location
      this.context.fillStyle = "#80008080";
      this.context.font = "20px Arial";
      this.context.fillText(`${current_location.latitude}, ${current_location.longitude}, ${current_location.speed}`, -this.canvas.width / 2, -this.canvas.height / 2 + 80);
      //<<

    }


    if(track_has_more_than_10_sec_of_data) {
      var delta_alt_prediction = this.track[this.track.length-1].gps_altitude + (this.track[this.track.length-1].gps_altitude - this.track[this.track.length-10].gps_altitude)  
      if( delta_alt_prediction > this.track[this.track.length-1].gps_altitude ) {
        this.context.lineWidth = delta_alt_prediction - this.track[this.track.length-1].gps_altitude
        this.context.strokeStyle = "#00FF00FF";
      } else if( delta_alt_prediction < this.track[this.track.length-1].gps_altitude ) {
        this.context.lineWidth = -delta_alt_prediction + this.track[this.track.length-1].gps_altitude
        this.context.strokeStyle = "#FF0000FF";
      } else {
        this.context.lineWidth = "1"
        this.context.strokeStyle = "#0000FF80";
      }
      this.context.beginPath()
      this.context.moveTo( 0,0 )
      this.context.lineTo( 0,-this.canvas.radius )
      this.context.stroke(); 
    }       

    // if (this.bearing > this.current_gauge_bearing -20) this.current_gauge_bearing -= 20;
    // else if (this.bearing < this.current_gauge_bearing-20) this.current_gauge_bearing += 20;

    this.context.save();
    this.context.rotate((-this.bearing) * Math.PI / 180);
    // this.context.rotate((-this.bearing) * Math.PI / 180);
    this.context.scale(1, -1)

    if (track_data_available) {
      //console.log(this.track[ this.track.length-1 ] )
      //this.context.fillText( this.track[ this.track.length-1 ].time, -15,15)         

      var distance = w => w * 11000 * 7 // ~ 

      var current_alt = this.track[this.track.length - 1].gps_altitude
      this.context.lineWidth = "1";
      for (var i = this.track.length - 1; i > 20; i--) {
        var dx = distance(this.track[i].longitude - current_location.longitude)
        var dy = distance(this.track[i].latitude - current_location.latitude)
        var d = Math.sqrt(dx * dy + dy * dy)
        var positionfactor = x => Math.round(x / 5) * 5

        this.context.fillStyle = "#00000020";
        this.context.beginPath();
        this.context.arc(positionfactor(dx), positionfactor(dy), 2, 0, 2 * Math.PI)
        this.context.fill();

        // var delta_alt = (this.track[i].gps_altitude - this.track[i-20].gps_altitude) / 10
        var delta_alt = (this.track[i].gps_altitude - this.track[i - 20].gps_altitude) / 10

        var lift_marker_shade_factor = 255 - Math.min(Math.abs(current_alt - this.track[i].gps_altitude), 255)
        if (delta_alt > 1) {
          this.context.fillStyle = "rgba( 0,128,0," + lift_marker_shade_factor / 255 + ")";
          this.context.beginPath();
          this.context.arc(positionfactor(dx), positionfactor(dy), Math.abs(delta_alt), 0, 2 * Math.PI)
          this.context.fill();
        } else if (delta_alt < -2) {
          this.context.fillStyle = "rgba( 192,0,0," + lift_marker_shade_factor / 255 + ")";
          this.context.beginPath();
          this.context.arc(positionfactor(dx), positionfactor(dy), Math.abs(delta_alt) * 1, 0, 2 * Math.PI)
          this.context.fill();
        } else {
        }
      }
    }

    this.draw_raster(current_location)
    this.draw_path_projection()
    this.draw_drift_indicator()

    //>> draw north indicator
    // this.context.strokeStyle = "#808000FF"
    // this.context.lineWidth = "3";
    // this.context.beginPath()
    // this.context.moveTo( -5,this.canvas.radius )
    // this.context.lineTo( -5,this.canvas.radius+15 )
    // this.context.lineTo( 5,this.canvas.radius+0 )
    // this.context.lineTo( 5,this.canvas.radius+15 )
    // this.context.stroke()
    //<<

    this.context.restore();



    this.draw_center_object();
  }

  draw_raster(current_location) {
  }

  draw_path_projection() {
  }

  draw_drift_indicator() {
  }

  draw_background() {
    this.context.fillStyle = "#F0F0C0";
    this.context.beginPath();
    this.context.arc(0, 0, this.canvas.radius, 0, 2 * Math.PI)
    this.context.fill();
    this.context.fillStyle = "#0000FF";
    this.context.strokeStyle = "#C0C0C0";
    this.context.lineWidth = "1";
    for (var r = this.canvas.radius / 4; r <= this.canvas.radius; r += this.canvas.radius / 4) {
      this.context.beginPath();
      this.context.arc(0, 0, r, 0, 2 * Math.PI)
      this.context.stroke();
    }

  }

  draw_center_object() {
    this.context.fillStyle = "#0000FF";
    this.context.beginPath();
    this.context.arc(0, 0, 10, 0, 2 * Math.PI)
    this.context.fill();
  }
}

customElements.define('gauge-360', GaugeLiftmate);
