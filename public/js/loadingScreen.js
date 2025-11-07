document.addEventListener('DOMContentLoaded', () => {
  const timeline = anime.timeline({
    loop: true,
    easing: "easeOutElastic(1, .8)",
  });

  timeline
    .add({
      targets: "#loading-screen .g",
      opacity: [0, 1],
      scale: [0.8, 1],
      rotateX: [90, 0],
      duration: 700,
    })
    .add({
      targets: "#loading-screen .p",
      opacity: [0, 1],
      scale: [0.8, 1],
      rotateX: [90, 0],
      duration: 700,
    }, "-=400")
    .add({
      targets: "#loading-screen .tracker",
      opacity: [0, 1],
      scale: [0.8, 1],
      rotateX: [90, 0],
      duration: 800,
    }, "-=500")
    .add({
      targets: "#loading-screen .payment",
      opacity: [0, 1],
      scale: [0.8, 1],
      rotateY: [-90, 0],
      duration: 700,
    }, "-=600")
    .add({
      targets: "#loading-screen .group",
      opacity: [0, 1],
      scale: [0.8, 1],
      rotateY: [-90, 0],
      duration: 700,
    }, "-=400")
    .add({
      targets: "#loading-screen .word",
      translateY: [0, -10],
      direction: "alternate",
      easing: "easeInOutSine",
      duration: 800,
      delay: anime.stagger(120),
    });

  timeline
    .add({
      targets: '#loading-screen .word',
      opacity: [1, 0],
      scale: [1, 0.6],
      rotateX: [0, -70],
      duration: 600,
      easing: 'easeInQuad',
      delay: anime.stagger(-80)
    })
    .add({ duration: 300 });  // Smoother pause
});