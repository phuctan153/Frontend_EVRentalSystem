import React from "react";
import { 
  Container, 
  Row, 
  Col,
  Button, 
  Image 
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import image2 from "./c79a26a8-113c-463f-bc32-23c4aa1958bb.png";

const App: React.FC = () => {
  return (
    <>

      {/* Main Section */}
      <Container fluid className="hero-section">
        <Row className="hero align-items-center justify-content-between min-vh-100">
          <Col lg={6} className="hero-text">
            <h1 className="display-1 fw-bold text-muted">404</h1>
            <h2 className="h1 text-secondary mb-4">PAGE NOT FOUND</h2>
            <p className="text-muted mb-4">
              Your search has ventured beyond the known universe.
            </p>
            <Button 
              variant="outline-secondary" 
              className="btn-custom rounded-pill px-4 py-2"
              href="#"
            >
              Back To Home
            </Button>
          </Col>
          <Col lg={6} className="hero-img text-center">
            <Image 
              src={image2} 
              alt="Astronaut" 
              className="astronaut img-fluid" 
              style={{ maxWidth: '350px' }}
            />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default App;