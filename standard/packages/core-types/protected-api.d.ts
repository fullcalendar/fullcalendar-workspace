
export interface BaseOptions {
}

export interface BaseOptionsRefined {
}

export interface EventSourceOptions {
}

export interface EventSourceOptionsRefined {
}

export type RawOptionsFromRefiners<Refiners extends GenericRefiners> = {
  [Prop in keyof Refiners]?: // all optional
    Refiners[Prop] extends ((input: infer RawType) => infer RefinedType)
      ? (any extends RawType ? RefinedType : RawType) // if input type `any`, use output (for Boolean/Number/String)
      : never
}

export type RefinedOptionsFromRefiners<Refiners extends GenericRefiners> = {
  [Prop in keyof Refiners]?: // all optional
    Refiners[Prop] extends ((input: any) => infer RefinedType) ? RefinedType : never
}

type GenericRefiners = {
  [propName: string]: (input: any) => any
}

export declare class JsonRequestError extends Error {
  response: Response;
  constructor(message: string, response: Response);
}

export declare function requestJson<ParsedResponse>(method: string, url: string, params: Dictionary): Promise<[ParsedResponse, Response]>;

export type Identity<T = any> = (raw: T) => T;

export declare function identity<T>(raw: T): T;
