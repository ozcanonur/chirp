import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { api, type RouterOutputs } from "~/utils/api";
import Image from "next/image";
import { LoadingSpinner } from "~/components/Loading";
import { useState } from "react";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState("");

  const ctx = api.useContext();
  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
  });

  if (!user) return null;

  return (
    <div className="flex w-full gap-6 pr-4">
      <Image
        src={user.profileImageUrl}
        alt="Profile image"
        width={56}
        height={56}
        className="rounded-full"
      />
      <input
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isPosting}
      />
      <button onClick={() => mutate({ content: input })}>Post</button>
    </div>
  );
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
const PostView = (props: PostWithUser) => {
  const { post, author } = props;

  return (
    <div
      key={post.id}
      className="flex items-center gap-6 border-b border-slate-500 p-4"
    >
      <Image
        src={author.profileImageUrl}
        width={56}
        height={56}
        className="rounded-full"
        alt="Profile Image"
      />
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1">
          <span className="text-sm">{`@${author.username}`}</span>
          <span className="text-xs text-slate-500">
            {dayjs(post.createdAt).fromNow()}
          </span>
        </div>
        <span>{post.content}</span>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading } = api.posts.getAll.useQuery(undefined, {
    retry: 0,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="mt-5 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (!data) return <div>Something went wrong.</div>;

  return (
    <div className="flex flex-col">
      {data.map((post) => (
        <PostView key={post.post.id} post={post.post} author={post.author} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { user, isLoaded: userLoaded } = useUser();

  // Prefetch feed
  api.posts.getAll.useQuery();

  if (!userLoaded) return <div />;

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center ">
        <div className="w-full border-x border-slate-500 md:max-w-2xl">
          <div className="flex border-b border-slate-500 p-4">
            <div className="flex w-full items-center justify-between">
              <CreatePostWizard />
              {user ? (
                <div className="w-16 text-sm">
                  <SignOutButton />
                </div>
              ) : (
                <div className="w-16 text-sm">
                  <SignInButton />
                </div>
              )}
            </div>
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
};

export default Home;
