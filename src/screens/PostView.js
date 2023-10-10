import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSession } from '../context'
import { requestServer } from '../utilities/requests'
import { formatBase64String, formatDate } from '../utilities/formatting'
import TextArea from '../components/TextArea'
import ScrollView from '../components/ScrollView'
import LoadingSpinner from '../components/LoadingSpinner'
import CommentTile from '../components/CommentTile'
import Scroller from '../components/Scroller'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ImageSlider } from 'react-native-image-slider-banner'
import { withTheme, Title2, Title3, Body, Caption1 } from 'react-native-ios-kit'
import { View, StyleSheet } from 'react-native'
import {
  Divider,
  IconButton,
  Chip,
  TouchableRipple
} from 'react-native-paper'

const styles = StyleSheet.create({
  informationView: {
    flexDirection: "column",
    justifyContent: "space-evenly",
    alignItems: "flex-start",
    gap: 8,
    padding: 16
  },
  informationActionsView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 8
  },
  categoriesChipsView: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    width: "40%",
    gap: 8
  },
  commentInputView: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    gap: 16,
    width: "100%",
  }
})

const fetchPost = async (postId) => {
  const payload = {
    post_id: postId
  }
  const post = await requestServer(
    "/posts_service/get_post_by_id",
    payload
  )

  return post
}

const fetchPostComments = async (postId) => {
  const payload = {
    post_id: postId
  }
  const comments = await requestServer(
    "/comments_service/get_post_comments",
    payload
  )

  return comments
}

const addPostComment = async (postId, storeId, text) => {
  const payload = {
    post_id: postId,
    user_id: storeId,
    text
  }
  const _ = await requestServer(
    "/comments_service/add_comment",
    payload
  )
}

const formatPostDate = (isoDateString) => {
  const formatted = `Publicado el ${formatDate(isoDateString)}`

  return formatted
}

const formatPostAmount = (amount) => {
  if (amount === 1) {
    return ""
  }

  const formatted = `${amount} unidades disponibles`

  return formatted
}

const CommentInput = ({ postId, storeId }) => {
  const queryClient = useQueryClient()

  const [text, setText] = useState("")

  const handleCommentSubmit = async () => {
    addCommentMutation.mutate({
      postId,
      storeId,
      text
    })
  }

  const addCommentMutation = useMutation(
    ({ postId, storeId, text }) => addPostComment(postId, storeId, text),
    {
      onSuccess: () => queryClient.refetchQueries({
        queryKey: ["postComments"]
      })
    }
  )

  return (
    <View style={styles.commentInputView}>
      <TextArea
        value={text}
        onChangeText={setText}
        placeholder="Escribe un comentario"
      />

      {
        addCommentMutation.isLoading ?
        <LoadingSpinner /> :
        <IconButton
          icon="send"
          mode="contained"
          disabled={text === ""}
          onPress={handleCommentSubmit}
        />
      }
    </View>
  )
}

const CommentsScrollView = ({ postId }) => {
  const [session, _] = useSession()

  const commentsQuery = useQuery({
    queryKey: ["postComments"],
    queryFn: () => fetchPostComments(postId)
  })

  if (commentsQuery.isLoading || session.isLoading) {
    return (
      <LoadingSpinner inScreen />
    )
  }

  return (
    <View>
      <CommentInput
        storeId={session.data.storeId}
        postId={postId}
      />

      <ScrollView
        data={commentsQuery.data}
        keyExtractor={(comment) => comment.comment_id}
        renderItem={({ item }) => <CommentTile comment={item} />}
        emptyIcon="comment"
        emptyMessage="No hay comentarios por aquí"
      />
    </View>
  )
}

const PostView = ({ postId, theme }) => {
  const navigation = useNavigation()

  const navigateToStoreView = () => {
    navigation.navigate("StoreView", {
      storeId: postQuery.data.store_id
    })
  }

  const postQuery = useQuery({
    queryKey: ["post"],
    queryFn: () => fetchPost(postId)
  })

  if (postQuery.isLoading) {
    return (
      <LoadingSpinner inScreen />
    )
  }

  const categoriesChips = postQuery.data.categories.map((category) => {
    return (
      <Chip
        key={category}
        mode="flat"
        icon="shape"
      >
        {category}
      </Chip>
    )
  })

  const post = postQuery.data
  const imageSliderData = post.multimedia.map((image) => {
    return {
      img: formatBase64String(image)
    }
  })

  return (
    <View>
      <ImageSlider
        data={imageSliderData}
        autoPlay={false}
      />

      <View style={styles.informationView}>
        <TouchableRipple
          onPress={navigateToStoreView}
        >
          <Title3
            style={{ color: theme.primaryColor }}
          >
            {post.store_name}
          </Title3>
        </TouchableRipple>

        <Title2>
          {post.title}
        </Title2>

        <Caption1
          style={{ color: "gray" }}
        >
          {formatPostDate(post.publication_date)}
        </Caption1>

        <Caption1
          style={{ color: "gray" }}
        >
          {
            formatPostAmount(post.amount)
          }
        </Caption1>

        <Body>
          {post.description}
        </Body>

        <View style={styles.informationActionsView}>
          <View style={styles.categoriesChipsView}>
            {categoriesChips}
          </View>
        </View>
      </View>
    </View>
  )
}

export default () => {
  const route = useRoute()

  const { postId } = route.params

  const ThemedPostView = withTheme(PostView)

  return (
    <Scroller>
      <SafeAreaView>
        <ThemedPostView postId={postId} />

        <Divider />

        <CommentsScrollView postId={postId} />
      </SafeAreaView>
    </Scroller>
  )
}
