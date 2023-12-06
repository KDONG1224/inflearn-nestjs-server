import { ValidationArguments } from 'class-validator';

/**
 * ValidationArguments의 프로퍼티들
 *
 * 1) value -> 검증 되고 있는 값 (입력된 값)
 * 2) constraints -> 파라미터에 입력된 제한 사항들
 *    args.constraints[0] -> 1
 *    args.constraints[1] -> 20
 * 3) targetName -> 검증되고 있는 클래스의 이름
 * 4) object -> 검증되고 있는 객체
 * 5) property -> 검증되고 있는 객체의 프로퍼티 이름
 */

export const legthValidationMessage = (args: ValidationArguments) => {
  if (args.constraints.length === 2) {
    return `${args.property}은(는) ${args.constraints[0]} ~ ${args.constraints[1]}자 사이로 입력해주세요.`;
  } else {
    return `${args.property}은(는) ${args.constraints[0]}자 이상 입력해주세요.`;
  }
};
