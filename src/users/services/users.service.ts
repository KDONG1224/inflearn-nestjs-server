// base
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';

// entities
import { UsersModel } from '../entities/users.entity';
import { UserFollowersModel } from '../entities/user-followers.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersModel)
    private usersRepository: Repository<UsersModel>,

    @InjectRepository(UserFollowersModel)
    private userFollowersRepository: Repository<UserFollowersModel>
  ) {}

  getUsersRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<UsersModel>(UsersModel)
      : this.usersRepository;
  }

  getUserFollowersRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<UserFollowersModel>(UserFollowersModel)
      : this.userFollowersRepository;
  }

  async create(user: Pick<UsersModel, 'nickname' | 'email' | 'password'>) {
    /**
     * 1) nickname 중복확인
     */
    const nicknameExists = await this.usersRepository.exist({
      where: { nickname: user.nickname }
    });

    if (nicknameExists) {
      throw new BadRequestException('이미 사용중인 닉네임입니다.');
    }

    /**
     * 2) email 중복확인
     */
    const emailExists = await this.usersRepository.exist({
      where: { email: user.email }
    });

    if (emailExists) {
      throw new BadRequestException('이미 사용중인 이메일입니다.');
    }

    const createUser = this.usersRepository.create({
      nickname: user.nickname,
      email: user.email,
      password: user.password
    });

    const newUser = await this.usersRepository.save(createUser);

    return newUser;
  }

  async getAllUsers() {
    const users = await this.usersRepository.find();

    return users;
  }

  async getUserByEmail(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });

    return user;
  }

  async followUser(followerId: number, followeeId: number, qr?: QueryRunner) {
    const userFollowersRepository = this.getUserFollowersRepository(qr);

    await userFollowersRepository.save({
      follower: { id: followerId },
      followee: { id: followeeId }
    });

    return true;
  }

  async getFollowers(userId: number, includeNotConfirmed: boolean) {
    const where = {
      followee: { id: userId }
    };

    if (!includeNotConfirmed) {
      where['isConfirmed'] = true;
    }

    const result = await this.userFollowersRepository.find({
      where,
      relations: {
        follower: true,
        followee: true
      }
    });

    return result.map((x) => ({
      id: x.follower.id,
      nickname: x.follower.nickname,
      email: x.follower.email,
      isConfirmed: x.isConfirmed
    }));
  }

  async confirmFollow(
    followerId: number,
    followeeId: number,
    qr?: QueryRunner
  ) {
    const userFollowersRepository = this.getUserFollowersRepository(qr);

    const existing = await userFollowersRepository.findOne({
      where: {
        follower: { id: followerId },
        followee: { id: followeeId }
      },
      relations: {
        follower: true,
        followee: true
      }
    });

    if (!existing) {
      throw new BadRequestException('존재하지 않는 팔로우 요청 입니다.');
    }

    await userFollowersRepository.save({ ...existing, isConfirmed: true });

    return true;
  }

  async deleteFollow(followerId: number, followeeId: number, qr?: QueryRunner) {
    const userFollowersRepository = this.getUserFollowersRepository(qr);

    await userFollowersRepository.delete({
      follower: { id: followerId },
      followee: { id: followeeId }
    });

    return true;
  }

  async incrementFollowCount(userId: number, qr?: QueryRunner) {
    const userRepository = this.getUsersRepository(qr);

    await userRepository.increment(
      {
        id: userId
      },
      'followerCount',
      1
    );
  }

  async decrementFollowCount(userId: number, qr?: QueryRunner) {
    const userRepository = this.getUsersRepository(qr);

    await userRepository.decrement(
      {
        id: userId
      },
      'followerCount',
      1
    );
  }
}
