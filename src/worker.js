let intervalId = null;
let beatsPerBar = 4;
let counter = 0;

self.addEventListener('message', (event) => {
  if (event.data.type === 'start') {
    const bpm = event.data.bpm;
    const beatsPerMeasure = event.data.beatsPerMeasure;
    
    let intervalCount = 0;
    let totalIntervalTime = 0;
    let previousTickTime = null;
    let intervalMs = 60000 / bpm;
    let calculateIntervalTime = 60000 / bpm;
    let averageIntervalTime = intervalMs;

    intervalId = setInterval(() => {
      if (previousTickTime !== null) {
        const expectedTime = intervalMs;
        const actualTime = Date.now() - previousTickTime;
        const timeDifference = actualTime - expectedTime;
        let tickAdjustment = 0;
        if (timeDifference > 2) {
          tickAdjustment = 1;
        } else if (timeDifference > 0) {
          tickAdjustment = timeDifference / 5;
        } else if (timeDifference < -2) {
          tickAdjustment = -1;
        } else if (timeDifference < 0) {
          tickAdjustment = timeDifference / 5;
        }
        intervalMs = Math.round(intervalMs + tickAdjustment);
        if (intervalMs < 10) {
          intervalMs = 10;
        }
      }
      if (counter % beatsPerMeasure === 0) {
        postMessage({sound: 'weaker-beat'});
      } else {
        postMessage({sound: 'strong-beat'});
      }
      previousTickTime = Date.now();
      counter = ++counter % beatsPerMeasure;
      totalIntervalTime += intervalMs;
      intervalCount++;
      averageIntervalTime = totalIntervalTime / intervalCount;
      if (averageIntervalTime < calculateIntervalTime - 1 || averageIntervalTime > calculateIntervalTime + 1) {
        intervalMs += calculateIntervalTime - averageIntervalTime;
        totalIntervalTime = intervalMs * intervalCount;
        console.group("[Worker] Latency detected, adjusting...");
        console.log("Tick played at: " + previousTickTime);
        console.log("Average Interval: " + averageIntervalTime.toFixed(2));
        console.groupEnd("[Worker] Latency detected, adjusting...");
      }
    }, intervalMs);
    beatsPerBar = beatsPerMeasure;
  } else if (event.data.type === 'stop') {
    clearInterval(intervalId)
  }
});