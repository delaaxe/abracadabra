import { Code } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import { createWriteInMemory } from "../../editor/adapters/write-code-in-memory";
import { flipIfElse } from "./flip-if-else";
import { testEach } from "../../tests-helpers";

describe("Flip If/Else", () => {
  let showErrorMessage: ShowErrorMessage;

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should flip if and else branch",
    [
      {
        description: "basic scenario",
        code: `if (isValid) {
  doSomething();
} else {
  doAnotherThing();
}`,
        expected: `if (!isValid) {
  doAnotherThing();
} else {
  doSomething();
}`
      },
      {
        description: "else branch doesn't exist yet",
        code: `if (isValid) {
  doSomething();
}`,
        expected: `if (!isValid) {} else {
  doSomething();
}`
      },
      {
        description: "an already flipped if statement",
        code: `if (!isValid) {
  doAnotherThing();
} else {
  doSomething();
}`,
        expected: `if (isValid) {
  doSomething();
} else {
  doAnotherThing();
}`
      },
      {
        description: "an if statement with a binary expression",
        code: `if (a > b) {
  doAnotherThing();
} else {
  doSomething();
}`,
        expected: `if (a <= b) {
  doSomething();
} else {
  doAnotherThing();
}`
      },
      {
        description: "an if statement with else-ifs",
        code: `if (a > b) {
  doSomething();
} else if (a === 10) {
  doSomethingWith(a);
} else if (b === 10) {
  doSomethingWith(b);
} else {
  doNothing();
}`,
        expected: `if (a <= b) {
  if (a === 10) {
    doSomethingWith(a);
  } else if (b === 10) {
    doSomethingWith(b);
  } else {
    doNothing();
  }
} else {
  doSomething();
}`
      },
      {
        description: "nested, cursor on wrapper",
        code: `if (isValid) {
  if (isVIP) {
    doSomethingForVIP();
  } else {
    doSomething();
  }
} else {
  doAnotherThing();
}`,
        expected: `if (!isValid) {
  doAnotherThing();
} else {
  if (isVIP) {
    doSomethingForVIP();
  } else {
    doSomething();
  }
}`
      },
      {
        description: "nested, cursor on nested",
        code: `if (isValid) {
  if (isVIP) {
    doSomethingForVIP();
  } else {
    doSomething();
  }
} else {
  doAnotherThing();
}`,
        selection: Selection.cursorAt(1, 2),
        expected: `if (isValid) {
  if (!isVIP) {
    doSomething();
  } else {
    doSomethingForVIP();
  }
} else {
  doAnotherThing();
}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doFlipIfElse(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if selection has no if statement", async () => {
    const code = `console.log("no if statement")`;
    const selection = Selection.cursorAt(0, 0);

    await doFlipIfElse(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundIfElseToFlip
    );
  });

  async function doFlipIfElse(code: Code, selection: Selection): Promise<Code> {
    const [write, getState] = createWriteInMemory(code);
    await flipIfElse(code, selection, write, showErrorMessage);
    return getState().code;
  }
});