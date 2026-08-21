declare module "papaparse" {
  export interface ParseResult<T> {
    data: T[];
    errors: Array<{
      code?: string;
      message: string;
      row?: number;
    }>;
    meta: {
      aborted: boolean;
      fields?: string[];
      delimiter?: string;
      linebreak?: string;
    };
  }

  export function parse<T>(
    input: string | File,
    config: {
      header?: boolean;
      skipEmptyLines?: boolean;
      transformHeader?: (header: string) => string;
      complete?: (results: ParseResult<T>) => void;
      error?: (error: { message: string }) => void;
    },
  ): void;

  const Papa: {
    parse: typeof parse;
  };

  export default Papa;
}
