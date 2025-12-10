import React from "react";
// import NavBar from "../components/NavBar";
import HeroSection from "../components/HeroSection";
import ProductCards from "../components/ProductCards"; // ✅ import your product section

const Home = () => {
  return (
    <div>
      {/* Nav Bar */}
      {/* <NavBar />   */}
      {/* Hero Section */}
      <HeroSection />

      {/* Product Section (below Hero) */}
      <ProductCards />
    </div>
  );
};

export default Home;
