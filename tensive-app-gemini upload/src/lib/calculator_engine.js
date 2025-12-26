// This engine handles the "well constrained" calculations.
// It ensures the bot doesn't do math "in its head" (which LLMs are bad at).

export const CALCULATOR_TYPES = {
  SPOT_REPAIR: 'spot_repair',
  FULL_ROOF: 'full_roof',
  LINEAR_FLASHING: 'linear_flashing'
};

export class CalculatorEngine {
  
  /**
   * Calculates material needs for a spot repair.
   * @param {number} length - Length in feet
   * @param {number} width - Width in feet
   * @param {number} count - Number of similar patches
   */
  static calculateSpotRepair(length, width, count = 1) {
    const areaPerPatch = length * width;
    const totalArea = areaPerPatch * count;
    
    // Logic: Base coat + Top coat + Fleece
    // Assuming 50 sq ft per gallon for base, 70 for top (Example rates)
    const baseCoatGallons = Math.ceil(totalArea / 50);
    const topCoatGallons = Math.ceil(totalArea / 70);
    const fleeceRolls = Math.ceil(totalArea / 400); // Assuming 400sqft rolls

    return {
      totalArea,
      materials: [
        { name: "Base Coat Resin", quantity: baseCoatGallons, unit: "gallons" },
        { name: "Top Coat Resin", quantity: topCoatGallons, unit: "gallons" },
        { name: "Reinforcement Fleece", quantity: fleeceRolls, unit: "rolls" }
      ]
    };
  }

  /**
   * Determines the next question to ask the user based on current state.
   * This drives the "Click Tree" logic.
   */
  static getNextStep(currentState) {
    if (!currentState.repairType) {
      return {
        question: "What type of repair are you planning?",
        options: [
          { label: "Spot Repair (Patches)", value: CALCULATOR_TYPES.SPOT_REPAIR },
          { label: "Full Roof Restoration", value: CALCULATOR_TYPES.FULL_ROOF },
          { label: "Linear Flashing", value: CALCULATOR_TYPES.LINEAR_FLASHING }
        ]
      };
    }

    if (currentState.repairType === CALCULATOR_TYPES.SPOT_REPAIR) {
      if (!currentState.dimensions) {
        return {
          question: "What are the dimensions of the damaged area?",
          inputType: "dimensions", // Signals UI to show L x W inputs
          fields: ["length", "width"]
        };
      }
      if (!currentState.count) {
        return {
          question: "How many of these patches do you need to do?",
          inputType: "number",
          field: "count"
        };
      }
    }

    return { isComplete: true };
  }
}
