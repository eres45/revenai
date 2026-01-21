import { MODELS, ModelId } from "./models";

export const isValidModel = (model: string): model is ModelId => {
  return Object.values(MODELS).includes(model as ModelId);
};

export { MODELS };
