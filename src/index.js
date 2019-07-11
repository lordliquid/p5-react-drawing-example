import React from "react";
import { render } from "react-dom";
import P5Wrapper from "react-p5-wrapper";
import p5 from "p5";

// Sloppy way of styling.. but it's a sandbox..
const styles = {
  fontFamily: "sans-serif",
  textAlign: "center",
  overflow: "hidden"
};

// Sloppy way of styling.. but it's a sandbox..
const header = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  position: "absolute",
  width: "100%",
  fontFamily: "fantasy",
  fontSize: 34,
  lineHeight: 0.2,
  userSelect: "none",
  color: "rgba(255,255,255,0.95)",
  textShadow: "#222 1px 0px 15px"
};

const controls = {
  display: "flex",
  background: "rgba(40,40,40,0.95)",
  position: "fixed",
  flexDirection: "column",
  userSelect: "none",
  padding: 20,
  marginTop: 50,
  cursor: "pointer"
};

const control = {
  display: "flex",
  userSelect: "none",
  flexDirection: "column",
  color: "white",
  cursor: "pointer"
};

// Particles along the path
class Particle {
  constructor(p, position, force, hue, drag, lifespan) {
    this.p = p;
    this.position = p.createVector(position.x, position.y);
    this.velocity = p.createVector(force.x, force.y);
    this.lifespan = lifespan;
    this.force = force;
    this.drag = drag;
    this.hue = hue;

    this.start = Date.now();
  }

  update() {
    // Move it
    this.position.add(this.velocity);

    // Slow it down
    this.velocity.mult(this.drag);

    // Fade it out
    let dt = Date.now() - this.start;
    let vel = 0.01 * dt;
    this.lifespan = this.lifespan - vel;
  }

  // Draw particle and connect it with a line
  // Draw a line to another
  display(other) {
    this.p.stroke(0, this.lifespan);
    this.p.fill(0, this.lifespan / 2);
    this.p.ellipse(this.position.x, this.position.y, 8, 8);

    // If we need to draw a line
    if (other) {
      this.p.line(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
    }
  }
}

// A Path is a list of particles
class Paths {
  constructor(p) {
    this.particles = [];
    this.p = p;
  }

  // Add a new particle with a position, force, and hue
  add(particle) {
    this.particles.push(particle);
  }

  // Display plath
  update() {
    for (var i = 0; i < this.particles.length; i++) {
      this.particles[i].update();
    }
  }

  // Display plath
  display() {
    // Loop through backwards
    for (var i = this.particles.length - 1; i >= 0; i--) {
      // If we shold remove it
      if (this.particles[i].lifespan <= 0) {
        this.particles.splice(i, 1);
      } else {
        // Otherwise, display it
        this.particles[i].display(this.particles[i + 1]);
      }
    }
  }
}

class App extends React.Component {
  constructor() {
    super();

    this.state = {
      hue: 0,
      drag: 0.2,
      baseHue: 255,
      lifespan: 255,
      painting: false
    };

    this.sketch = this.sketch.bind(this);
  }

  sketch(p) {
    // All the paths
    var paths = new Paths(p);

    // How long until the next circle
    var next = 0;

    // Where are we now and where were we?
    var current;
    var previous;

    p.setup = () => {
      p.createCanvas(window.innerWidth, window.innerHeight);
      current = p.createVector(0, 0);
      previous = p.createVector(0, 0);
      this.setState({ hue: p.random(this.state.baseHue) });
    };

    p.draw = () => {
      p.background(255);
      // If it's time for a new point
      if (p.millis() > next && this.state.painting) {
        // Grab mouse position
        current.x = p.mouseX;
        current.y = p.mouseY;

        // New particle's force is based on mouse movement
        var force = p5.Vector.sub(current, previous);
        force.mult(0.05);

        paths.particles[paths.particles.length - 1].add(
          new Particle(
            p,
            current,
            force,
            this.state.hue,
            this.state.drag,
            this.state.lifespan
          )
        );

        // Schedule next circle
        next = p.millis() + p.random(10);

        // Store mouse values
        previous.x = current.x;
        previous.y = current.y;
      }

      // Draw all paths
      for (var i = 0; i < paths.particles.length; i++) {
        paths.particles[i].update();
        paths.particles[i].display(paths.particles[i]);
      }
    };

    // Start it up
    p.mousePressed = () => {
      next = 0;
      this.setState({ painting: true });
      previous.x = p.mouseX;
      previous.y = p.mouseY;
      paths.particles.push(new Paths(p));
    };

    // Stop
    p.mouseReleased = () => {
      this.setState({ painting: false });
    };
  }

  changeLifetime(e) {
    const { value } = e.target;
    // e.persist();
    this.setState({
      baseHue: value,
      lifespan: value
    });
  }

  render() {
    return (
      <div style={styles}>
        <div style={header}>
          <h1>Draw Something!</h1>
          <h3>Click & Drag</h3>
        </div>
        <div style={controls}>
          <div style={control}>
            <label>Lifespan : {this.state.lifespan}</label>
            <input
              type="range"
              onChange={this.changeLifetime.bind(this)}
              min="255"
              max="5000"
            />
          </div>
        </div>
        <P5Wrapper sketch={this.sketch.bind(this)} />
      </div>
    );
  }
}
render(<App />, document.getElementById("root"));
