const paths = [
  "/production-schedule",
  "/shop-drawings",
  "/panel-matrix",
  "/takeoff-matrix",
  "/fab-matrix",
  "/all-activities",
  "/glass-and-gasket",
  "/metal",
  "/field",
  "/packaging",
  "/purchasing",
  "/jmp-field-tracking"
]

export default async function handler(req, res) {
  // Check for secret to confirm this is a valid request

  // if (req.query.secret !== process.env.MY_SECRET_TOKEN) {
  //   return res.status(401).json({ message: 'Invalid token' })
  // }


  try {

    // const paths = await api.pathsToRevalidate()
    // console.log(paths)

    // // Revalidate every path
    // await Promise.all(paths.map(res.revalidate))

    // for (let path of paths) {
    //   try {
    //     await res.revalidate(path)
    //   } catch (error) {
    //     console.log(error)
    //   }
      
    // }

    await res.revalidate("/production-schedule")


    // Return a response to confirm everything went ok
    return res.json({ revalidated: true })

  } catch (err) {
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return res.status(500).send('Error revalidating: ' + err)
  }
}